import {autorun, isAction} from 'mobx';
import {describe, expect, it, vi} from 'vitest';
import {OopReactAction, OopReactConfigure, OopReactObservable} from '../src/index';

describe('MobX strict mode', () => {
  it('is off by default, so a write outside an action is accepted', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    class Counter {
      count = 0;

      constructor() {
        OopReactObservable(this);
      }
    }

    const counter = new Counter();
    const seen: number[] = [];
    const stop = autorun(() => seen.push(counter.count));

    counter.count = 1; // no action in sight
    stop();

    expect(seen).toEqual([0, 1]);
    expect(error).not.toHaveBeenCalled();
  });

  it('lets an async method write after an await', async () => {
    class Loader {
      phase = 'idle';
      result = '';

      constructor() {
        OopReactObservable(this);
      }

      async run(): Promise<void> {
        this.phase = 'loading';
        await Promise.resolve();
        // The action ended at the await; with strict mode on this line throws.
        this.result = 'done';
        this.phase = 'ready';
      }
    }

    const loader = new Loader();
    const seen: string[] = [];
    const stop = autorun(() => seen.push(loader.phase));

    await loader.run();
    stop();

    expect(loader.result).toBe('done');
    expect(seen).toEqual(['idle', 'loading', 'ready']);
  });

  it('can be turned back on for an application that wants it', () => {
    // MobX 7 reports a violation with console.warn, not by throwing.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const restore = OopReactConfigure({enforceActions: 'always'});

    try {
      class Guarded {
        count = 0;

        constructor() {
          OopReactObservable(this);
        }
      }

      const guarded = new Guarded();
      const stop = autorun(() => guarded.count);

      guarded.count = 1;

      expect(warn.mock.calls.flat().join(' ')).toMatch(/strict-mode/);

      stop();
    } finally {
      // Also proves the returned restore function does what it says.
      restore();
    }
  });

  it('@OopReactAction() keeps a method one transaction, map or no map', () => {
    class Batch {
      a = 0;
      b = 0;

      @OopReactAction()
      both(): void {
        this.a += 1;
        this.b += 1;
      }

      constructor() {
        // The map tries to opt the method out; the decorator wins.
        OopReactObservable(this, {both: false});
      }
    }

    const batch = new Batch();
    const seen: number[] = [];
    const stop = autorun(() => seen.push(batch.a + batch.b));

    expect(isAction(batch.both)).toBe(true);
    batch.both();
    stop();

    // Two writes, one notification: that is the transaction.
    expect(seen).toEqual([0, 2]);
  });
});
