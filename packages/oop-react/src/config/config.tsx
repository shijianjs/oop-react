import type {ComponentType, ReactNode} from 'react';
import {DefaultErrorFallback} from '../error/DefaultErrorFallback';
import {makeInstanceObservable, type OopReactObservableOptions} from '../reactivity/reactivity';
import {ObservedRender} from '../render/ObservedRender';
import type {OopReactFallbackProps} from './OopReactFallbackProps';

/**
 * The three seams a consumer can replace, plus the error reporter.
 *
 * Everything here has a working default, and the default is what an application
 * gets without touching this API. Replace one when the default does not fit:
 * a design-system error card, a different reactivity engine, a logger.
 */
export interface OopReactConfig {
  /**
   * Subscribes a render function to the observable state it reads and returns
   * the React node to render.
   *
   * Called while a component renders, so the implementation may use hooks.
   */
  observe(render: () => ReactNode): ReactNode;
  /**
   * Makes an object's fields observable in place. Called once per instance,
   * before its first render.
   */
  observable<T extends object>(instance: T, options?: OopReactObservableOptions): T;
  /** Rendered in place of a render method that threw. */
  fallback: ComponentType<OopReactFallbackProps>;
  /** Called once per caught render error. */
  onError(error: unknown, name?: string): void;
}

const defaults: OopReactConfig = {
  observe: (render) => <ObservedRender render={render} />,
  observable: (instance, options) => makeInstanceObservable(instance, options),
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
