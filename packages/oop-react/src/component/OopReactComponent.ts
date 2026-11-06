import {useEffect, useRef, type ComponentType, type ReactNode} from 'react';
import {OopReactObservable, type OopReactAnnotations} from '../reactivity/reactivity';
import {COMPONENT_NAME} from '../render/islandName';

/** Keys of `Instance` whose value is a method returning JSX. */
export type OopReactRenderMethodKey<Instance> = {
  [Key in keyof Instance]: Instance[Key] extends (...args: any[]) => ReactNode ? Key : never;
}[keyof Instance];

export interface OopReactComponentOptions<Props, Instance> {
  /**
   * The name this component and its islands report: DevTools shows
   * `<name>.<method>`, and a render error's fallback shows the island it came
   * from. Defaults to the class name, which a production build minifies — pass
   * one when the name is read by a human.
   */
  name?: string;
  /**
   * Whether this factory should declare the instance's state for it. Default
   * `true`, which is what makes an *existing* plain class usable as-is. A class
   * that already calls `OopReactObservable(this)` in its constructor needs
   * nothing here — the second call is a no-op.
   */
  autoObservable?: boolean;
  /** Field overrides used when `autoObservable` does the declaring. */
  annotations?: OopReactAnnotations<Instance>;
  /**
   * Called after mount and whenever `props` change. The instance itself is
   * created once per mount and never replaced, so a prop is an input to the
   * constructor and, for later changes, this hook.
   */
  onPropsChange?: (instance: Instance, props: Props, previousProps: Props) => void;
}

/**
 * Mounts one render method of a class as a React component — the bridge between
 * an object graph and the React tree.
 *
 * ```tsx
 * // the only React-aware line in an otherwise plain-object application
 * export const WorkshopView = OopReactComponent(Workshop, 'view');
 * ```
 *
 * This is not the main way to use the library. The main way is to `new` your
 * state objects wherever they belong, let them hold each other, and call their
 * `@OopReactRender()` methods from a component that already exists. Reach for
 * `OopReactComponent` when a class has to *be* a component: adopting the
 * library one screen at a time in a React app, or exposing a piece of the graph
 * to a page that only speaks props.
 *
 * `props` are forwarded to the constructor. The instance lives as long as the
 * component is mounted and is never rebuilt.
 */
export function OopReactComponent<Props extends object, Instance extends object>(
  Class: new (props: Props) => Instance,
  method: OopReactRenderMethodKey<Instance>,
  options: OopReactComponentOptions<Props, Instance> = {},
): ComponentType<Props> {
  const componentName = options.name ?? Class.name;

  // The decorator reads this off the instance when it builds an island, so the
  // name a reader sees comes from here rather than from a minified class name.
  Object.defineProperty(Class.prototype, COMPONENT_NAME, {
    value: componentName,
    configurable: true,
  });

  function OopReactClassView(props: Props): ReactNode {
    const instanceRef = useRef<Instance | null>(null);
    if (instanceRef.current === null) {
      const created = new Class(props);
      instanceRef.current =
        options.autoObservable === false
          ? created
          : OopReactObservable(created, options.annotations);
    }
    const instance = instanceRef.current;

    const previousProps = useRef(props);
    const {onPropsChange} = options;
    useEffect(() => {
      const previous = previousProps.current;
      previousProps.current = props;
      onPropsChange?.(instance, props, previous);
    }, [instance, onPropsChange, props]);

    // `call` rather than `instance[method]()`: with `autoObservable: false` the
    // methods are not bound, and a detached call would lose `this`.
    const render = instance[method] as unknown as () => ReactNode;
    return render.call(instance);
  }

  OopReactClassView.displayName = `${componentName}.${String(method)}`;
  return OopReactClassView;
}
