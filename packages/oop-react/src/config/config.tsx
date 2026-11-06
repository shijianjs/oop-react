import type {ComponentType} from 'react';
import {DefaultErrorFallback} from '../error/DefaultErrorFallback';
import type {OopReactFallbackProps} from './OopReactFallbackProps';

/**
 * What an application may replace: how a failed island looks, and where the
 * failure is reported.
 *
 * Nothing about reactivity is configurable here on purpose — the reactive core
 * is MobX, used as MobX, and a state class declares its own observability in its
 * constructor (see `OopReactObservable`). A seam there would only hide the one
 * thing this library is actually built on.
 */
export interface OopReactConfig {
  /** Rendered in place of a render method that threw. */
  fallback: ComponentType<OopReactFallbackProps>;
  /** Called once per caught render error. */
  onError(error: unknown, name?: string): void;
}

const defaults: OopReactConfig = {
  fallback: DefaultErrorFallback,
  onError: (error, name) => {
    console.error(`[oop-react] ${name ?? 'a render method'} threw`, error);
  },
};

let current: OopReactConfig = defaults;

/** @internal — read by the components in this package. */
export function getOopReactConfig(): OopReactConfig {
  return current;
}

/**
 * Replaces part of the default implementation.
 *
 * Returns a function that restores what was configured before, which is what a
 * test uses to undo its own override.
 */
export function OopReactConfigure(patch: Partial<OopReactConfig>): () => void {
  const previous = current;
  current = {...current, ...patch};
  return () => {
    current = previous;
  };
}
