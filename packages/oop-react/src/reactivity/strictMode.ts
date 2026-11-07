import {configure} from 'mobx';

/**
 * The value MobX uses for `enforceActions`, spelled the way MobX accepts it.
 *
 * - `never` (default here): any field may be written anywhere. Mutations are
 *   still batched when they happen inside a method, because methods are actions.
 * - `observed` / `always`: MobX starts policing writes that happen outside an
 *   action — a `console.warn` per write, which is MobX's default and the reason
 *   `async` code that writes after an `await` prints a warning per line.
 */
export type OopReactEnforceActions = 'never' | 'observed' | 'always';

/**
 * Sets MobX's `enforceActions`.
 *
 * Called once when the library loads, with `never`: this framework's premise is
 * "a field is state, `this.count += 1` is how you change it", and strict mode
 * turns exactly that into a warning on every such line. The transactional
 * behaviour people expect from MobX does **not** come from this flag — it comes
 * from methods being actions (see `@OopReactAction()`), so switching it off loses
 * the police, not the batching.
 *
 * A host application that wants strict mode can pass `'always'` here, or call
 * MobX's own `configure({enforceActions: 'always'})` after importing this package.
 */
export function applyEnforceActions(value: OopReactEnforceActions = 'never'): void {
  configure({enforceActions: value});
}
