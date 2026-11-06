import {isObservable, makeAutoObservable, type AnnotationMapEntry} from 'mobx';
import {reportDuplicateMobx} from './duplicates';

/** Set on instances this module has already handled, so calling twice is a no-op. */
const OBSERVED = Symbol.for('oop-react.observed');

/**
 * Per-field overrides for MobX, keyed by the instance's **real** field names.
 *
 * `{client: false}` type-checks against `keyof T`, so a typo — or a field that
 * was renamed and left behind in the map — is a compile error rather than a
 * silently ignored annotation, which is what plain MobX's `{[key: string]: …}`
 * signature gives you.
 */
export type OopReactAnnotations<T> = {[Key in keyof T]?: AnnotationMapEntry};

export interface OopReactObservableOptions {
  /** Bind every method to the instance, so `this.onClick` is a stable reference. */
  autoBind?: boolean;
  /** Track nested objects and arrays, or only reassignment of the field itself. */
  deep?: boolean;
}

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
 * Every field becomes observable, every method an action bound to the instance,
 * and the second argument excludes what is not state — a service, a DOM node, a
 * cache, or another state object that already declared its own observability.
 *
 * This is MobX's `makeAutoObservable` with two additions: the field-name types,
 * and idempotence. Everything else about MobX — `computed`, `flow`, `reaction`,
 * `autorun`, `toJS` — is used directly, imported from `mobx`.
 */
export function OopReactObservable<T extends object>(
  instance: T,
  annotations?: OopReactAnnotations<T>,
  options: OopReactObservableOptions = {},
): T {
  reportDuplicateMobx();

  const marked = instance as T & {[OBSERVED]?: boolean};
  if (marked[OBSERVED] === true || isObservable(instance)) {
    return instance;
  }

  makeAutoObservable(instance as never, annotations as never, {
    autoBind: options.autoBind ?? true,
    deep: options.deep ?? true,
  });
  Object.defineProperty(instance, OBSERVED, {value: true, enumerable: false});

  return instance;
}
