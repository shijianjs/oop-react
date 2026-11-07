import {isObservable, makeObservable} from 'mobx';
import {collectActions} from './action';
import {reportDuplicateMobx} from './duplicates';
import {collectIgnored} from './ignore';

/** Per-field overrides for MobX, keyed by the instance's **real** field names. */
export type OopReactAnnotations<T> = {[Key in keyof T]?: unknown};

export interface OopReactObservableOptions {
  /** Bind every method to the instance, so `this.onClick` is a stable reference. */
  autoBind?: boolean;
  /** Track nested objects and arrays, or only reassignment of the field itself. */
  deep?: boolean;
}

/** Which keys an instance has already been annotated for, so a subclass can add more. */
const annotated = new WeakMap<object, Set<string>>();

/**
 * Collects every key that should get MobX's **default** annotation (`true`).
 *
 * `true` is what makes this work: MobX's auto annotation inspects the descriptor
 * and picks observable / computed / bound action / flow on its own, honouring the
 * `deep` and `autoBind` options. Passing it explicitly is what lets us hand over
 * a key set that `makeAutoObservable` would refuse to build.
 */
function buildAnnotations(
  instance: object,
  overrides: OopReactAnnotations<object> | undefined,
  already: ReadonlySet<string>,
): Record<string, unknown> {
  const ignored = collectIgnored(instance);
  const map: Record<string, unknown> = {};

  const put = (key: string): void => {
    if (already.has(key) || key in map || ignored.has(key)) return;
    map[key] = true;
  };

  // Own fields — including a function in a field initialiser
  // (`readonly save = flow(...)`), which the auto annotation treats as a method.
  for (const key of Object.keys(instance)) {
    put(key);
  }

  // Methods and getters, own **and inherited**. This is the part
  // `makeAutoObservable` cannot do: it throws on a class with a superclass.
  for (
    let prototype = Object.getPrototypeOf(instance) as object | null;
    prototype !== null && prototype !== Object.prototype;
    prototype = Object.getPrototypeOf(prototype)
  ) {
    for (const key of Object.getOwnPropertyNames(prototype)) {
      if (key === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      if (descriptor === undefined) continue;
      if (typeof descriptor.value === 'function' || typeof descriptor.get === 'function') {
        put(key);
      }
    }
  }

  // Explicit overrides win over everything inferred above.
  if (overrides !== undefined) {
    for (const [key, annotation] of Object.entries(overrides)) {
      if (annotation === undefined) continue;
      if (annotation === false) {
        delete map[key];
        continue;
      }
      map[key] = annotation;
    }
  }

  // `@OopReactAction()` wins over everything above: the method is one transaction
  // even if the map (or `autoBind: false`) would have left it plain.
  for (const key of collectActions(instance)) {
    if (typeof (instance as Record<string, unknown>)[key] === 'function') {
      map[key] = true;
    }
  }

  return map;
}

/**
 * Declares an object's state, in the object's own constructor:
 *
 * ```ts
 * class Cart {
 *   @OopReactIgnore readonly api = new ApiClient();
 *   items: Item[] = [];
 *
 *   constructor() {
 *     OopReactObservable(this);
 *   }
 * }
 * ```
 *
 * Every field becomes observable, every method an action bound to the instance,
 * every getter a computed, every generator a flow. On top of MobX's
 * `makeAutoObservable`:
 *
 * - **Inheritance.** The whole prototype chain is annotated, and calling this
 *   again in a subclass constructor only adds the keys that appeared since — so
 *   `class Derived extends Base` works even when both call it.
 * - **A denylist instead of a whitelist.** Fields that are not state are marked
 *   with `@OopReactIgnore` beside their declaration instead of being collected in
 *   one map at the constructor. The map still works: pass it here and it wins.
 */
export function OopReactObservable<T extends object>(
  instance: T,
  annotations?: OopReactAnnotations<T>,
  options: OopReactObservableOptions = {},
): T {
  reportDuplicateMobx();

  const already = annotated.get(instance);

  // Made observable by its own decorators or by hand: leave it alone — unless we
  // are the ones who annotated it and this is a subclass adding more keys.
  if (already === undefined && isObservable(instance)) {
    return instance;
  }

  const applied = already ?? new Set<string>();
  const map = buildAnnotations(instance, annotations as OopReactAnnotations<object>, applied);
  const keys = Object.keys(map);

  if (keys.length > 0) {
    // A second pass (a subclass constructor) must not pass options: MobX rejects
    // them for an object that is already observable. The annotation map from the
    // first pass already carries them.
    const first = already === undefined;
    makeObservable(
      instance,
      map as never,
      first ? {autoBind: options.autoBind ?? true, deep: options.deep ?? true} : (undefined as never),
    );
    for (const key of keys) applied.add(key);
  }

  annotated.set(instance, applied);
  return instance;
}
