import type {Key, ReactNode} from 'react';
import {TrackedRender} from './TrackedRender';

export interface OopReactObserverOptions {
  /**
   * Its identity in a list — the same idea as `@OopReactRender({key})`.
   *
   * It has to be given here, not returned from the render function: React
   * compares keys among **siblings at the parent**, and the content is only
   * known after the render function has run.
   */
  key?: Key | null | undefined;
}

/**
 * Subscribes any function that returns JSX to the observable state it reads.
 *
 * This is the primitive `@OopReactRender()` is built on. It is public for the
 * few places where a class method is not the natural unit — a render prop, an
 * inline block inside an existing component — and it must be called while a
 * component renders, because it renders a component itself.
 *
 * ```tsx
 * function Total() {
 *   return OopReactObserver(() => <strong>{cart.items.length}</strong>);
 * }
 * ```
 */
export function OopReactObserver(
  render: () => ReactNode,
  options: OopReactObserverOptions = {},
): ReactNode {
  return <TrackedRender key={options.key} render={render} />;
}
