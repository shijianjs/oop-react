import type {ReactNode} from 'react';
import {TrackedRender} from './TrackedRender';

/**
 * Subscribes any function that returns JSX to the observable state it reads.
 *
 * This is the primitive `@OopReactRender()` is built on. It is public for the
 * few places where a class method is not the natural unit — a render prop, an
 * inline block inside an existing component — and it must be called while a
 * component renders, because it renders a component itself.
 */
export function OopReactObserver(render: () => ReactNode): ReactNode {
  return <TrackedRender render={render} />;
}
