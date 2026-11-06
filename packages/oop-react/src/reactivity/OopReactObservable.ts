import {
  makeInstanceObservable,
  type OopReactAnnotations,
  type OopReactObservableOptions,
} from './reactivity';

export type {OopReactAnnotations, OopReactObservableOptions};

/**
 * Declares an object's state, in the object's own constructor:
 *
 * ```ts
 * class Cart {
 *   readonly api = new ApiClient();
 *   items: Item[] = [];
 *
 *   constructor() {
 *     OopReactObservable(this, {api: false});
 *   }
 * }
 * ```
 *
 * Every field becomes observable, every method an action bound to the
 * instance, and the second argument excludes the fields that are not state — a
 * service, a DOM node, a cache, or another state object that already declared
 * its own observability.
 *
 * This is a thin, typed wrapper over MobX's `makeAutoObservable`: the only
 * things it adds are the field-name types and idempotence. Everything else
 * about MobX — `computed`, `flow`, `reaction`, `autorun` — is used directly, by
 * importing it from `mobx`.
 */
export function OopReactObservable<T extends object>(
  instance: T,
  annotations?: OopReactAnnotations<T>,
  options?: OopReactObservableOptions,
): T {
  return makeInstanceObservable(instance, annotations, options);
}
