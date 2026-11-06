import {useEffect, useRef, type ComponentType, type ReactNode} from 'react';
import {getOopReactConfig} from '../config/config';
import {COMPONENT_NAME} from '../render/islandName';
import type {OopReactObservableOptions} from '../reactivity/reactivity';

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
   * `false` when the class sets up its own observability (MobX decorators, a
   * hand-written store). Default: this library makes the instance observable.
   */
  autoObservable?: boolean;
  /** Fields to leave alone, and other overrides, for the default observable adapter. */
  observableOptions?: OopReactObservableOptions;
  /**
   * Called after mount and whenever `props` change. The instance itself is
   * created once per mount and never replaced, so a prop is an input to the
   * constructor and, for later changes, this hook.
   */
  onPropsChange?: (instance: Instance, props: Props, previousProps: Props) => void;
}

/**
 * Turns a class plus one of its render methods into a React component.
 *
 * ```tsx
 * class Counter {
 *   count = 0;
 *   @OopReactRender() view() { … }
 * }
 * export const CounterView = OopReactComponent(Counter, 'view');
 * ```
 *
 * `props` are forwarded to the constructor. The instance lives for as long as
 * the component is mounted — that is the point: it is the stable context every
 * method and every handler on it shares, which is what a hook-based component
 * has to rebuild on each render.
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
          : getOopReactConfig().observable(created, options.observableOptions);
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
