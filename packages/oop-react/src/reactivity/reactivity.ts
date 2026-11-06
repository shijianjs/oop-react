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
 * Turns a plain object into observable state: every field becomes tracked, every
 * method becomes an action, and (by default) every method is bound to the
 * instance.
 *
 * Call it **from the class's own constructor** — that is where a state class
 * declares what is state, and it makes the class usable anywhere, not only
 * inside a component:
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
 * It is deliberately *additive*: the object is not wrapped in a proxy or copied,
 * so the instance a caller holds is the instance that renders, and identity
 * comparisons keep working. Calling it twice is a no-op.
 */
export function makeInstanceObservable<T extends object>(
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
