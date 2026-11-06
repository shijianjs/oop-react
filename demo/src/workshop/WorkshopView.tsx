import type {ReactNode} from 'react';
import type {Workshop} from './Workshop';

/**
 * The whole React side of this application: hand the graph's root island to
 * React. No hooks, no state, no props beyond the object itself.
 *
 * `OopReactComponent(Workshop, 'view')` would do the same thing when a class has
 * to be mounted as a component — see the docs' "React bridge" page.
 */
export function WorkshopView({workshop}: {workshop: Workshop}): ReactNode {
  return workshop.view();
}
