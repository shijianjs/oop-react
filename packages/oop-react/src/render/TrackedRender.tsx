import {observer} from 'mobx-react-lite';
import type {ReactNode} from 'react';
import {reportDuplicateMobx} from '../reactivity/duplicates';

export interface TrackedRenderProps {
  /** The function whose observable reads decide when this component re-renders. */
  render: () => ReactNode;
}

/**
 * The whole reactivity contract of the library, in one component.
 *
 * Tracking is `observer` from `mobx-react-lite` — the official React binding —
 * rather than a hand-rolled `Reaction`: it subscribes the render to exactly the
 * fields it reads, re-throws what the render throws (so the error boundary above
 * can catch it), batches updates through React's own machinery, and keeps
 * working when React changes its scheduling.
 *
 * A render function must not write state: it is called while React renders, and
 * a write would invalidate the subscription it is currently running inside.
 */
export const TrackedRender = observer(function TrackedRender({render}: TrackedRenderProps): ReactNode {
  // Checked here as well as where instances are made observable: an app that
  // brings its own MobX-managed stores passes `autoObservable: false` and would
  // otherwise never reach that other check.
  reportDuplicateMobx();

  return render();
});
