import type {Key, ReactNode} from 'react';
import {OopReactErrorBoundary} from '../error/OopReactErrorBoundary';
import {islandName} from './islandName';
import {ObservedRender} from './ObservedRender';

/**
 * `any[]` rather than `unknown[]` on purpose: this type is used as a *constraint*
 * on user methods, and a method taking typed arguments (`(row: Row) => …`) has
 * to satisfy it.
 */
export type OopReactRenderFunction = (...args: any[]) => ReactNode;

interface OopReactRenderIslandProps {
  instance: object;
  method: OopReactRenderFunction;
  args: unknown[];
  name: string;
}

/**
 * The element a render method hands back to its caller.
 *
 * Two things live here, both of which must wrap *each* island rather than the
 * component as a whole: the subscription (so only the fields this method reads
 * trigger a re-render) and the error boundary (so one broken method does not
 * take the page down).
 *
 * Creating the element is side-effect free, so the method can be called from any
 * render — a plain React component, another island, a parent object's method.
 */
export function OopReactRenderIsland({
  instance,
  method,
  args,
  name,
}: OopReactRenderIslandProps): ReactNode {
  return (
    <OopReactErrorBoundary name={name}>
      <ObservedRender render={() => method.apply(instance, args)} />
    </OopReactErrorBoundary>
  );
}

export interface OopReactRenderOptions {
  /**
   * The owner name used in this island's name (`<name>.<method>`): what the
   * fallback prints and what `onError` reports.
   *
   * It exists because the default is the class name, and a production build
   * minifies that into `AD`. Pass the name a reader would recognise when the
   * island is one a human will see fail:
   *
   * ```tsx
   * @OopReactRender({name: 'FlakySection'})
   * content() { … }
   * ```
   */
  name?: string;
  /**
   * Derives the React key when this method renders one entry of a list.
   *
   * The key has to be produced here because the island's element is created
   * inside the decorator — a caller mapping over objects has no element to put a
   * key on. It receives the instance first, then the call arguments:
   *
   * ```tsx
   * // the object renders itself, so its identity is its own
   * @OopReactRender({key: (self: TodoItem) => self.id})
   * row() { … }
   *
   * // the parent renders rows for its children
   * @OopReactRender({key: (self: TodoBoard, item: TodoItem) => item.id})
   * row(item: TodoItem) { … }
   * ```
   */
  key?: (instance: any, ...args: any[]) => Key | null | undefined;
}

/**
 * Turns a method that returns JSX into a self-contained, subscribed React
 * subtree.
 *
 * The decorated method keeps its signature, so a caller still writes
 * `this.view()`; what changes is that the returned element re-renders on its
 * own whenever the state *that method read* changes. Everything outside a
 * decorated method — the plain fields, the methods that mutate them, the
 * callbacks they hand to JSX — is ordinary object code and never re-runs on a
 * render.
 *
 * Requires `experimentalDecorators` (the legacy decorator model), which is also
 * what MobX-style class code in this ecosystem already uses.
 */
export function OopReactRender(options: OopReactRenderOptions = {}): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    const method = descriptor?.value as OopReactRenderFunction | undefined;
    if (typeof method !== 'function') {
      throw new TypeError(
        `@OopReactRender() can only decorate a method that returns ReactNode (got ${String(propertyKey)}).`,
      );
    }

    descriptor.value = function (this: object, ...args: unknown[]): ReactNode {
      const name =
        options.name === undefined
          ? islandName(this, propertyKey)
          : `${options.name}.${String(propertyKey)}`;

      return (
        <OopReactRenderIsland
          key={options.key?.(this, ...args)}
          instance={this}
          method={method}
          args={args}
          name={name}
        />
      );
    } as never;

    return descriptor;
  };
}
