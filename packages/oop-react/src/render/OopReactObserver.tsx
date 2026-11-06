import type {ReactNode} from 'react';
import {ObservedRender} from './ObservedRender';

/**
 * Subscribes any function that returns JSX to the observable state it reads.
 *
 * This is the primitive `@OopReactRender()` is built on. It is public for the
 * few places where a class method is not the natural unit — a render prop, an
 * inline block inside an existing component — and it must be called while a
 * component renders, because it uses hooks.
 */
export function OopReactObserver(render: () => ReactNode): ReactNode {
  return <ObservedRender render={render} />;
}
