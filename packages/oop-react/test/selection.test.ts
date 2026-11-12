import {describe, expect, it} from 'vitest';
import {OopReactSelection} from '../src/index';

describe('OopReactSelection', () => {
  it('adds, removes and toggles without duplicates', () => {
    const selection = new OopReactSelection<number>();

    selection.add(1);
    selection.add(1);
    expect(selection.ids).toEqual([1]);
    expect(selection.has(1)).toBe(true);

    selection.toggle(1);
    expect(selection.ids).toEqual([]);

    selection.toggle(2);
    expect(selection.ids).toEqual([2]);

    selection.remove(2);
    expect(selection.empty).toBe(true);
  });

  it('replaces the whole set from a table event', () => {
    const selection = new OopReactSelection<number>();
    selection.add(1);

    selection.set([2, 3, 3]);

    expect(selection.ids).toEqual([2, 3]);
    expect(selection.size).toBe(2);
  });

  it('knows all / partial / none for a given total', () => {
    const selection = new OopReactSelection<number>();

    expect(selection.isAll(3)).toBe(false);
    expect(selection.isPartial(3)).toBe(false);

    selection.add(1);
    expect(selection.isAll(3)).toBe(false);
    expect(selection.isPartial(3)).toBe(true);

    selection.set([1, 2, 3]);
    expect(selection.isAll(3)).toBe(true);
    expect(selection.isPartial(3)).toBe(false);

    // 空集合不算全选，即使 total 也是 0。
    selection.clear();
    expect(selection.isAll(0)).toBe(false);
  });
});
