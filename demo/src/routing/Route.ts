import type {MessageKey} from '../i18n/messages';
import type {Page} from '../pages/Page';

/**
 * One entry of the routing table: everything the menu needs, plus how to build
 * the page when that route is entered.
 *
 * The instance is deliberately not stored here. A route table is metadata —
 * paths and titles, resolved before anything is mounted — and the page behind an
 * entry is created on entry. An application with hundreds of routes therefore
 * pays for the one on screen, not for all of them.
 */
export interface Route {
  /** Hash route without the `#/`, e.g. `todos`. */
  readonly path: string;
  readonly titleKey: MessageKey;
  /** Builds the page for this route; called each time the route is entered. */
  readonly create: () => Page;
}
