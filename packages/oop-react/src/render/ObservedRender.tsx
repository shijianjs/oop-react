import {Reaction} from 'mobx';
import {useEffect, useReducer, useRef, type ReactNode} from 'react';
import {reportDuplicateMobx} from '../reactivity/duplicates';

export interface ObservedRenderProps {
  /** The function whose observable reads decide when this component re-renders. */
  render: () => ReactNode;
}

/**
 * The whole reactivity contract of the library, in one component.
 *
 * It runs `render()` inside a MobX reaction, so the render function subscribes
 * to exactly the fields it reads — not to the object it lives on, and not to a
 * parent's state. When one of those fields changes, this component re-renders
 * and nothing else does.
 *
 * A render function must not write state: it is called while React renders, and
 * a write would invalidate the reaction it is currently running inside.
 */
export function ObservedRender({render}: ObservedRenderProps): ReactNode {
  // Also checked here, not only where instances are made observable: an app that
  // brings its own MobX-managed stores passes `autoObservable: false` and would
  // otherwise never reach that other check.
  reportDuplicateMobx();

  const [, invalidate] = useReducer((version: number) => version + 1, 0);
  const reactionRef = useRef<Reaction | null>(null);

  // A disposed reaction is left behind by StrictMode's mount/unmount/mount and
  // by a remount after an error boundary reset; both re-render first, so the
  // lazy re-creation below always runs before the next track().
  if (reactionRef.current === null || reactionRef.current.isDisposed) {
    reactionRef.current = new Reaction('OopReactRender', invalidate);
  }
  const reaction = reactionRef.current;

  useEffect(() => () => reaction.dispose(), [reaction]);

  // The error is captured inside the reaction and re-thrown outside it: MobX
  // reports a derivation's exception through `onReactionError` instead of
  // re-throwing it, and a swallowed error would leave React rendering nothing
  // instead of showing the boundary's fallback.
  let output: ReactNode = null;
  let failure: {error: unknown} | null = null;
  reaction.track(() => {
    try {
      output = render();
    } catch (error) {
      failure = {error};
    }
  });
  if (failure !== null) {
    throw (failure as {error: unknown}).error;
  }
  return output;
}
