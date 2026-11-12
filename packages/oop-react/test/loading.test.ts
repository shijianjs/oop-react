import {autorun} from 'mobx';
import {describe, expect, it, vi} from 'vitest';
import {OopReactLoading, OopReactTimeoutError} from '../src/index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return {promise, resolve};
}

describe('OopReactLoading', () => {
  it('flips loading around the task and returns the value', async () => {
    const loading = new OopReactLoading();
    const seen: boolean[] = [];
    const stop = autorun(() => seen.push(loading.loading));

    const result = await loading.run(async () => {
      expect(loading.loading).toBe(true);
      return 42;
    });

    stop();

    expect(result).toEqual({ok: true, value: 42});
    expect(seen).toEqual([false, true, false]);
  });

  it('turns a rejection into a failed result instead of throwing', async () => {
    const loading = new OopReactLoading();
    const error = new Error('boom');

    const result = await loading.run(async () => {
      throw error;
    });

    expect(result).toEqual({ok: false, error, timedOut: false});
    expect(loading.loading).toBe(false);
  });

  it('reports a timeout as timedOut and clears loading', async () => {
    vi.useFakeTimers();
    try {
      const loading = new OopReactLoading();
      const pending = loading.run(() => new Promise<number>(() => {}), {timeoutMs: 100});

      await vi.advanceTimersByTimeAsync(100);
      const result = await pending;

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.timedOut).toBe(true);
      expect(result.ok === false && result.error instanceof OopReactTimeoutError).toBe(true);
      expect(loading.loading).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays loading while a second run on the same object is still going', async () => {
    const loading = new OopReactLoading();
    const first = deferred<number>();
    const second = deferred<number>();

    const firstRun = loading.run(() => first.promise);
    const secondRun = loading.run(() => second.promise);

    first.resolve(1);
    await firstRun;
    expect(loading.loading).toBe(true);

    second.resolve(2);
    await secondRun;
    expect(loading.loading).toBe(false);
  });
});
