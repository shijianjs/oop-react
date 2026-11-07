import {action, computed, flow, isObservable, makeObservable, observable} from 'mobx';
import {reportDuplicateMobx} from './duplicates';

/** Field names marked with `@OopReactIgnore`, stored on the prototype they were declared on. */
const IGNORED = Symbol.for('oop-react.ignore');

export interface OopReactIgnoreTarget {
  [IGNORED]?: Set<string>;
}

/**
 * Keeps a field as a plain field: not observable, not tracked.
 *
 * ```ts
 * class Cart {
 *   @OopReactIgnore readonly api = new ApiClient();
 *   @OopReactIgnore readonly board: Board;
 *   items: Item[] = [];
 * }
 * ```
 *
 * This exists because "everything except these two" is the common shape, and
 * MobX's own decorators are the opposite — you whitelist every observable field
 * instead. The mark can be inherited (it lives on the prototype and subclasses
 * are covered by the same mark), and the annotation map passed to
 * `OopReactObservable` still wins over it for one-off cases.
 */
export function OopReactIgnore(target: object, propertyKey: string | symbol): void {
  if (typeof propertyKey !== 'string') {
    throw new TypeError('@OopReactIgnore() can only be applied to a string-named field.');
  }

  const prototype = target as OopReactIgnoreTarget;
  const keys = prototype[IGNORED] ?? new Set<string>();
  keys.add(propertyKey);
  prototype[IGNORED] = keys;
}

/** Every ignored field of the instance, including the ones a base class marked. */
export function collectIgnored(instance: object): Set<string> {
  const result = new Set<string>();

  for (
    let prototype = Object.getPrototypeOf(instance) as OopReactIgnoreTarget | null;
    prototype !== null && prototype !== Object.prototype;
    prototype = Object.getPrototypeOf(prototype)
  ) {
    for (const key of prototype[IGNORED] ?? []) {
      result.add(key);
    }
  }

  return result;
}
