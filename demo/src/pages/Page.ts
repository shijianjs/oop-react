import type {ReactNode} from 'react';

/**
 * What a page is once a route has created it: the element it renders and the
 * link to its source.
 *
 * The path and the menu title are route metadata (`routing/Route.ts`), not page
 * fields — keeping them there is what lets the menu be drawn without building a
 * single page.
 */
export interface Page {
  /** Path of this page's source inside the repository, linked from the header. */
  readonly sourcePath: string;
  view(): ReactNode;
}
