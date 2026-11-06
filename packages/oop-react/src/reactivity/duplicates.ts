let reported = false;

/**
 * Warns when the page holds more than one copy of MobX.
 *
 * Two copies cannot see each other: MobX keys its bookkeeping on a symbol made
 * per module instance, so a `Reaction` from copy B never subscribes to a value
 * created by copy A. The failure mode is the bad one — no error, no warning from
 * MobX itself (it only complains about *incompatible* versions), just "the state
 * changed and the UI did not". That symptom is expensive to diagnose from the
 * outside, so it is worth one `console.warn` here.
 *
 * `__mobxInstanceCount` is MobX's own counter of loaded copies, and it has been
 * there since MobX 4, so it is stable across the versions this package supports.
 */
export function reportDuplicateMobx(): void {
  if (reported) return;
  const count = (globalThis as {__mobxInstanceCount?: number}).__mobxInstanceCount;
  if (typeof count !== 'number' || count < 2) return;
  reported = true;
  console.warn(
    `[oop-react] ${count} copies of mobx are loaded in this page. Each copy only tracks the observables it created, ` +
      'so an island rendered under one copy will never re-render when another copy\'s state changes — the ' +
      'classic "state changed, UI did not" bug. Keep exactly one copy: run `pnpm why mobx`, then `pnpm dedupe` ' +
      'or pin a single version through overrides/resolutions. oop-react declares mobx as a peerDependency for ' +
      'this reason.',
  );
}
