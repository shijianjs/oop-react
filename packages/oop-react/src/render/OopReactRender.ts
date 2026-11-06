import {createElement, type ReactNode} from 'react';
import {getOopReactConfig} from '../config/config';
import {OopReactErrorBoundary} from '../error/OopReactErrorBoundary';
import {islandName} from './islandName';

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
 */
export function OopReactRenderIsland({
  instance,
  method,
  args,
  name,
}: OopReactRenderIslandProps): ReactNode {
  const {observe} = getOopReactConfig();
  return createElement(
    OopReactErrorBoundary,
    {name},
    observe(() => method.apply(instance, args)),
  );
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
export function OopReactRender(): MethodDecorator {
  return function (target, propertyKey, descriptor) {
    const method = descriptor?.value as OopReactRenderFunction | undefined;
    if (typeof method !== 'function') {
      throw new TypeError(
        `@OopReactRender() can only decorate a method that returns ReactNode (got ${String(propertyKey)}).`,
      );
    }

    descriptor.value = function (this: object, ...args: unknown[]): ReactNode {
      const name = islandName(this, propertyKey);
      return createElement(OopReactRenderIsland, {instance: this, method, args, name});
    } as never;

    return descriptor;
  };
}
