import type {ComponentType} from 'react';
import {DefaultErrorFallback} from '../error/DefaultErrorFallback';
import {applyEnforceActions, type OopReactEnforceActions} from '../reactivity/strictMode';
import type {OopReactFallbackProps} from './OopReactFallbackProps';

/**
 * What an application may replace: how a failed island looks, where the failure is
 * reported, and whether MobX polices writes that happen outside an action.
 */
export interface OopReactConfig {
  /** Rendered in place of a render method that threw. */
  fallback: ComponentType<OopReactFallbackProps>;
  /** Called once per caught render error. */
  onError(error: unknown, name?: string): void;
  /**
   * MobX's `enforceActions`, and it **defaults to `'never'`**.
   *
   * The premise of this library is "a field is state, `this.count += 1` is how it
   * changes": strict mode turns that into an error, which is why it is off here.
   * Batching is not affected — methods are actions regardless, so writing three
   * fields in one method is still one re-render.
   *
   * Set it to `'always'` / `'observed'` to get MobX's default policing back.
   */
  enforceActions: OopReactEnforceActions;
}

const defaults: OopReactConfig = {
  fallback: DefaultErrorFallback,
  onError: (error, name) => {
    console.error(`[oop-react] ${name ?? 'a render method'} threw`, error);
  },
  enforceActions: 'never',
};

// The first thing this package does. A host that wants strict mode passes
// `'always'` to `OopReactConfigure`, or calls MobX's own `configure` afterwards.
applyEnforceActions(defaults.enforceActions);

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

  if (patch.enforceActions !== undefined) {
    applyEnforceActions(patch.enforceActions);
  }

  return () => {
    current = previous;
    applyEnforceActions(previous.enforceActions);
  };
}
