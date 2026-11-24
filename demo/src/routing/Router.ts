import {OopReactIgnore, OopReactState} from 'oop-react';
import type {Page} from '../pages/Page';
import type {Route} from './Route';

/**
 * Routing as an object, not a library.
 *
 * Hash routing on purpose: the demo is a static directory inside the Pages site,
 * so `/demo/todos` would 404 on a refresh unless the host knew about it. `#/todos`
 * needs no server configuration and survives a reload.
 *
 * The table holds metadata only. Entering a route builds its page and swaps it in
 * together with `path`; the page that was left is released instead of cached, so
 * visiting a route does not accumulate page state for the lifetime of the app.
 */
@OopReactState
export class Router {
  @OopReactIgnore readonly routes: readonly Route[];
  /**
   * The page of the current route. Observable on purpose: `current` is a
   * computed, and replacing the instance is what invalidates it. The instance is
   * a class, not a plain object, so MobX keeps the reference as-is instead of
   * wrapping it.
   */
  private page: Page;
  /** The observable bit: the current route is a path. */
  path: string;

  constructor(routes: readonly Route[]) {
    const [first] = routes;
    if (first === undefined) {
      throw new Error('Router needs at least one route.');
    }

    this.routes = routes;
    this.path = this.pathOf(location.hash);
    this.page = this.route(this.path).create();

    // The graph lives for the whole application, so a listener outliving it is
    // fine here; an application that can rebuild its graph would dispose it.
    window.addEventListener('hashchange', () => this.sync());
  }

  get current(): Page {
    return this.page;
  }

  goPath(path: string): void {
    const route = this.route(path);
    const hash = `#/${route.path}`;
    if (location.hash !== hash) {
      location.hash = hash;
    }

    if (route.path === this.path) {
      return;
    }

    // Build before swapping: a page constructor that throws leaves the current
    // route intact instead of half-applied.
    const page = route.create();
    this.page = page;
    this.path = route.path;
  }

  private sync(): void {
    this.goPath(this.pathOf(location.hash));
  }

  /** The path in a hash, falling back to the first route when it is unknown. */
  private pathOf(hash: string): string {
    const path = hash.replace(/^#\/?/, '');
    return this.routes.find((route) => route.path === path)?.path ?? this.routes[0]!.path;
  }

  private route(path: string): Route {
    return this.routes.find((route) => route.path === path) ?? this.routes[0]!;
  }
}
