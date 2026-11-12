import type {Key, ReactNode} from 'react';
import {OopReactObserver} from './OopReactObserver';

export interface OopReactCallbackOptions<Args extends unknown[]> {
  /** The identity of the rendered entry — it receives the call arguments. */
  key?: (...args: Args) => Key | null | undefined;
}

/**
 * Wraps a function that returns JSX into a callback that renders an island when
 * it is called.
 *
 * It exists for the shape a component-in-a-prop needs:
 *
 * ```tsx
 * const renderRow = OopReactCallback(
 *   (row: Row) => <li>{row.title}</li>,
 *   {key: (row: Row) => row.id},
 * );
 *
 * <ul>{rows.map(renderRow)}</ul>
 * ```
 *
 * The key belongs to the callback, not to the element inside it: it is the
 * island that sits in the parent's list, so a `key` on the `<li>` would not help.
 *
 * The returned function uses React hooks, so it must be called during a render —
 * as a render prop is — and not from an event handler.
 */
export function OopReactCallback<Args extends unknown[], Result extends ReactNode>(
  render: (...args: Args) => Result,
  options: OopReactCallbackOptions<Args> = {},
): (...args: Args) => Result {
  return function (this: unknown, ...args: Args): Result {
    return OopReactObserver(() => render.apply(this, args), {key: options.key?.(...args)}) as Result;
  };
}
