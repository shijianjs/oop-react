import {OopReactObservable} from './reactivity';

/**
 * Lifecycle hooks a state class may implement. `@OopReactState` calls `init`
 * once, right after the instance is observable.
 */
export interface OopReactStateHooks {
  /** Runs once, after every field is initialised and observable. */
  init?(): void;
  /** Never called automatically: who created the object is who disposes it. */
  dispose?(): void;
}

type StateClass = new (...args: any[]) => object;

/**
 * Declares a class as state, so no constructor is needed:
 *
 * ```ts
 * @OopReactState
 * class Cart {
 *   @OopReactIgnore readonly api = new ApiClient();
 *   items: Item[] = [];
 * }
 * // new Cart() — fields observable, methods bound actions, getters computed
 * ```
 *
 * It wraps the constructor, which is what makes it work for inheritance: the
 * wrapper body runs *after* the class's own initialisers, and a subclass gets its
 * own wrapper, so each level is annotated once its fields exist. (`OopReactObservable`
 * called by hand has to be the last line of the constructor for the same reason,
 * and gets it wrong when forgotten.)
 *
 * `init()` is the answer to "what about the work that needs the object to be
 * observable already" — a `reaction`, registering listeners, seeding defaults.
 * Keep it small: most effects belong in the setter that causes them.
 */
export function OopReactState<T extends StateClass>(Class: T): T {
  const Wrapped = class extends Class {
    // `any[]` is what TS asks for in a mixin-style `extends` of a type parameter.
    constructor(...args: any[]) {
      super(...args);
      OopReactObservable(this);
      (this as OopReactStateHooks).init?.();
    }
  };

  // Keep the name: it is what island names, DevTools and error reports show.
  Object.defineProperty(Wrapped, 'name', {value: Class.name, configurable: true});

  return Wrapped as unknown as T;
}
