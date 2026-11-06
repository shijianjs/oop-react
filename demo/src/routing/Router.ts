import {OopReactObservable} from 'oop-react';
import type {Page} from '../pages/Page';

/**
 * Routing as an object, not a library.
 *
 * Hash routing on purpose: the demo is a static directory inside the Pages site,
 * so `/demo/todos` would 404 on a refresh unless the host knew about it. `#/todos`
 * needs no server configuration and survives a reload.
 */
export class Router {
  readonly pages: Page[];
  readonly fallback: Page;
  /** The observable bit: the current route is a path, resolved by a computed. */
  path: string;

  constructor(pages: Page[]) {
    const [first] = pages;
    if (first === undefined) {
      throw new Error('Router needs at least one page.');
    }

    this.pages = pages;
    this.fallback = first;
    this.path = this.match(location.hash)?.path ?? first.path;

    // The graph lives for the whole application, so a listener outliving it is
    // fine here; an application that can rebuild its graph would dispose it.
    window.addEventListener('hashchange', () => this.sync());

    OopReactObservable(this, {pages: false, fallback: false});
  }

  get current(): Page {
    return this.byPath(this.path);
  }

  byPath(path: string): Page {
    return this.pages.find((page) => page.path === path) ?? this.fallback;
  }

  go(page: Page): void {
    this.path = page.path;
    const hash = `#/${page.path}`;
    if (location.hash !== hash) {
      location.hash = hash;
    }
  }

  private sync(): void {
    this.path = this.match(location.hash)?.path ?? this.fallback.path;
  }

  private match(hash: string): Page | undefined {
    const path = hash.replace(/^#\/?/, '');
    return this.pages.find((page) => page.path === path);
  }
}
