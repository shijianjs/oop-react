import {isObservable, makeAutoObservable} from 'mobx';

/** Set on instances this module has already handled, so calling twice is a no-op. */
const OBSERVED = Symbol.for('oop-react.observed');

export interface OopReactObservableOptions {
  /**
   * Per-field overrides for MobX's `makeAutoObservable`. In practice the value
   * that matters is `false` — this field is not state (a service, a DOM node, a
   * cache) and must not be converted into an observable.
   */
  annotations?: Record<string, unknown>;
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
 * This is the default implementation behind `OopReactConfigure({observable})`
 * and `OopReactComponent`. It is deliberately *additive*: the object is not
 * wrapped in a proxy or copied, so the instance a caller holds is the instance
 * that renders, and identity comparisons keep working.
 */
export function makeInstanceObservable<T extends object>(
  instance: T,
  options: OopReactObservableOptions = {},
): T {
  const marked = instance as T & {[OBSERVED]?: boolean};
  if (marked[OBSERVED] === true || isObservable(instance)) {
    return instance;
  }

  makeAutoObservable(instance as never, options.annotations as never, {
    autoBind: options.autoBind ?? true,
    deep: options.deep ?? true,
  });
  Object.defineProperty(instance, OBSERVED, {value: true, enumerable: false});

  return instance;
}
