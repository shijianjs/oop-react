/** Method names marked with `@OopReactAction`, stored on the prototype they were declared on. */
const ACTIONS = Symbol.for('oop-react.action');

export interface OopReactActionTarget {
  [ACTIONS]?: Set<string>;
}

/**
 * Makes a method one transaction: every field it writes while running is applied
 * as a single change, so readers see the before or the after — never the middle.
 *
 * ```ts
 * class OrderEditor {
 *   @OopReactAction()
 *   reset(): void {
 *     this.customer = '';
 *     this.amount = 0;
 *     this.saving = false;   // one re-render, not three
 *   }
 * }
 * ```
 *
 * In most classes this is redundant: `@OopReactState` already treats every method
 * as a bound action. It earns its keep when
 * - the class was declared with `autoBind: false` or a hand-written annotation
 *   map that opts methods out,
 * - or the intent is worth spelling out at the method.
 *
 * It does not make `async` methods transactional beyond their first `await` —
 * nothing can. Use a `flow` (a generator method) when every step of an async
 * sequence should be its own action, and `runInAction` when only a block inside a
 * method needs to be one.
 */
export function OopReactAction(): MethodDecorator {
  return function (target, propertyKey): void {
    if (typeof propertyKey !== 'string') {
      throw new TypeError('@OopReactAction() can only be applied to a string-named method.');
    }

    const prototype = target as OopReactActionTarget;
    const keys = prototype[ACTIONS] ?? new Set<string>();
    keys.add(propertyKey);
    prototype[ACTIONS] = keys;
  };
}

/** Every method marked with `@OopReactAction`, including inherited ones. */
export function collectActions(instance: object): Set<string> {
  const result = new Set<string>();

  for (
    let prototype = Object.getPrototypeOf(instance) as OopReactActionTarget | null;
    prototype !== null && prototype !== Object.prototype;
    prototype = Object.getPrototypeOf(prototype)
  ) {
    for (const key of prototype[ACTIONS] ?? []) {
      result.add(key);
    }
  }

  return result;
}
