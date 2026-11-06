import type {ReactNode} from 'react';
import {OopReactObserver} from './OopReactObserver';

/**
 * Wraps a function that returns JSX into a callback that renders an island when
 * it is called.
 *
 * It exists for the shape a component-in-a-prop needs:
 *
 * ```tsx
 * <List renderRow={OopReactCallback((row: Row) => <span>{row.title}</span>)} />
 * ```
 *
 * The returned function uses React hooks, so it must be called during a render —
 * as a render prop is — and not from an event handler.
 */
export function OopReactCallback<Args extends unknown[], Result extends ReactNode>(
  render: (...args: Args) => Result,
): (...args: Args) => Result {
  return function (this: unknown, ...args: Args): Result {
    return OopReactObserver(() => render.apply(this, args)) as Result;
  };
}
