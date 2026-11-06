import {getOopReactConfig} from '../config/config';
import type {OopReactObservableOptions} from './reactivity';

export type {OopReactObservableOptions};

/**
 * Makes an already-constructed object observable, through whatever
 * `OopReactConfigure({observable})` points at.
 *
 * `OopReactComponent` does this for the instance it creates. Reach for it
 * directly when an instance outlives a single component — a store shared by
 * several classes, a service handed down from outside React. Calling it twice
 * is a no-op.
 */
export function OopReactObservable<T extends object>(
  instance: T,
  options?: OopReactObservableOptions,
): T {
  return getOopReactConfig().observable(instance, options);
}
