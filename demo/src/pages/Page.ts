import type {ReactNode} from 'react';
import type {MessageKey} from '../i18n/messages';

/**
 * What the router and the menu need to know about a page. No base class on
 * purpose: a base constructor would run before the subclass fields exist, and
 * `OopReactObservable(this)` needs those fields to already be assigned.
 */
export interface Page {
  /** Hash route without the `#/`, e.g. `todos`. */
  readonly path: string;
  readonly titleKey: MessageKey;
  /** Path of this page's source inside the repository, linked from the header. */
  readonly sourcePath: string;
  view(): ReactNode;
}
