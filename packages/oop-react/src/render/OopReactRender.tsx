import {memo, type Key, type ReactNode} from 'react';
import {OopReactErrorBoundary} from '../error/OopReactErrorBoundary';
import {islandName} from './islandName';
import {TrackedRender} from './TrackedRender';

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

function sameArgs(left: unknown[], right: unknown[]): boolean {
  if (left === right) return true;
  if (left.length !== right.length) return false;
  return left.every((value, index) => Object.is(value, right[index]));
}

let nextInstanceId = 0;
const instanceIds = new WeakMap<object, number>();

/**
 * A stable id per object, used in the default React key.
 *
 * Every island element has the same component type, so without a key React
 * reuses the fiber when a parent swaps one island for another — for instance when
 * the router renders a different page: the same fiber would then run a different
 * render method, and any hooks the two methods call (a `Modal.useModal` here, none
 * there) would change the hook count mid-fiber, which React rejects with
 * "Rendered more hooks than during the previous render".
 */
function instanceId(instance: object): number {
  let id = instanceIds.get(instance);
  if (id === undefined) {
    id = (nextInstanceId += 1);
    instanceIds.set(instance, id);
  }
  return id;
}

/**
 * Islands are memoized on what actually identifies them: the instance, the
 * method, the name and the call arguments. So a parent island re-rendering does
 * **not** re-run a child island whose arguments did not change — the child still
 * re-renders on its own when a field *it* read changes.
 *
 * That is what makes "split it as fine as you like" true: React re-renders
 * children by default, and without this every state change in a parent would
 * re-execute every nested render method on the way down.
 *
 * Note that the arguments are compared, not the objects inside them: mutating a
 * field of an argument object is caught by the child's own subscription, which
 * is exactly the case this must not skip.
 */
function isSameIsland(previous: OopReactRenderIslandProps, next: OopReactRenderIslandProps): boolean {
  return (
    previous.instance === next.instance &&
    previous.method === next.method &&
    previous.name === next.name &&
    sameArgs(previous.args, next.args)
  );
}

/**
 * The element a render method hands back to its caller.
 *
 * Two things live here, both of which must wrap *each* island rather than the
 * component as a whole: the subscription (so only the fields this method reads
 * trigger a re-render) and the error boundary (so one broken method does not
 * take the page down).
 *
 * The boundary sits *outside* the tracked component on purpose: the render
 * method runs while `TrackedRender` renders, so an element can only be caught by
 * an ancestor. `observer` re-throws what the render throws, which is what lets
 * this boundary see it.
 *
 * The `memo` here is ours, not `observer`'s: `observer` memoizes on props with a
 * shallow comparison, and `args` is a fresh array on every call, so it would
 * never skip. Comparing the arguments ourselves is what makes nested islands
 * independent of a parent's re-render.
 *
 * Creating the element is side-effect free, so the method can be called from any
 * render — a plain React component, another island, a parent object's method.
 */
export const OopReactRenderIsland = memo(function OopReactRenderIsland({
  instance,
  method,
  args,
  name,
}: OopReactRenderIslandProps): ReactNode {
  return (
    <OopReactErrorBoundary name={name}>
      <TrackedRender render={() => method.apply(instance, args)} />
    </OopReactErrorBoundary>
  );
}, isSameIsland);

export interface OopReactRenderOptions<Instance = any> {
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
   * key on. Most lists key on one field of the object, so a field name is
   * accepted too (pass the class as a type argument to have it checked):
   *
   * ```tsx
   * // one field — the common case
   * @OopReactRender({key: 'id'})
   * row() { … }
   *
   * // checked against the instance
   * @OopReactRender<TodoItem>({key: 'id'})
   *
   * // anything derived: a function, receiving the instance then the arguments
   * @OopReactRender({key: (self: TodoItem) => `${self.board.id}-${self.id}`})
   * row() { … }
   *
   * // the parent renders rows for its children
   * @OopReactRender({key: (_self: TodoBoard, item: TodoItem) => item.id})
   * row(item: TodoItem) { … }
   * ```
   */
  key?: keyof Instance | ((instance: Instance, ...args: any[]) => Key | null | undefined);
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
export function OopReactRender<Instance = any>(
  options: OopReactRenderOptions<Instance> = {},
): MethodDecorator {
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
      // Default: the object and the method identify the island, so React does not
      // reuse the fiber for a *different* island in the same position.
      const fallbackKey = `${instanceId(this)}.${String(propertyKey)}`;

      return (
        <OopReactRenderIsland
          key={resolveKey(options.key, this, args, fallbackKey)}
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

/** `key: 'id'` reads that field; a function is called with the instance and the arguments. */
function resolveKey<Instance>(
  option: OopReactRenderOptions<Instance>['key'],
  instance: object,
  args: unknown[],
  fallback: Key,
): Key {
  if (option === undefined) return fallback;

  if (typeof option === 'function') {
    return option(instance as Instance, ...args) ?? fallback;
  }

  const value = (instance as Record<PropertyKey, unknown>)[option as PropertyKey];
  return (value as Key | null | undefined) ?? fallback;
}
