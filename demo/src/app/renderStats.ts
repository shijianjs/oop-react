/**
 * Render counters for the demo, deliberately **not** observable.
 *
 * Each card prints how many times its own render method ran. The number is read
 * from a plain map, so rendering does not subscribe to it and printing it does
 * not cause a re-render — which is exactly what makes it honest evidence: a
 * counter that moved was a render, and one that did not move was not.
 */
const counts = new Map<string, number>();

export function bumpRender(key: string): number {
  const next = (counts.get(key) ?? 0) + 1;
  counts.set(key, next);
  return next;
}
