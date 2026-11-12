import {describe, expect, it} from 'vitest';
import {OopReactResource} from '../src/index';

describe('OopReactResource', () => {
  it('keeps the value and clears the error on success', async () => {
    const resource = new OopReactResource<number[]>();

    const result = await resource.load(async () => [1, 2]);

    expect(result).toEqual({ok: true, value: [1, 2]});
    expect(resource.data).toEqual([1, 2]);
    expect(resource.error).toBe(null);
  });

  it('keeps the last value and records the error on failure', async () => {
    const resource = new OopReactResource<number[]>();
    await resource.load(async () => [1]);
    const error = new Error('nope');

    const result = await resource.load(async () => {
      throw error;
    });

    expect(result.ok).toBe(false);
    expect(resource.data).toEqual([1]);
    expect(resource.error).toBe(error);
  });

  it('exposes loading while the fetcher is in flight', async () => {
    const resource = new OopReactResource<string>();
    let settle!: (value: string) => void;
    const pending = resource.load(
      () =>
        new Promise<string>((resolve) => {
          settle = resolve;
        }),
    );

    expect(resource.loading.loading).toBe(true);

    settle('done');
    await pending;

    expect(resource.loading.loading).toBe(false);
    expect(resource.data).toBe('done');
  });

  it('invalidate clears both data and error', async () => {
    const resource = new OopReactResource<number>();
    await resource.load(async () => 1);
    await resource.load(async () => {
      throw new Error('nope');
    });

    resource.invalidate();

    expect(resource.data).toBe(null);
    expect(resource.error).toBe(null);
  });
});
