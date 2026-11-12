import {describe, expect, it} from 'vitest';
import {OopReactCleanup} from '../src/index';

describe('OopReactCleanup', () => {
  it('runs every disposer once and empties itself', () => {
    const cleanup = new OopReactCleanup();
    const ran: string[] = [];

    cleanup.add(() => ran.push('a'));
    cleanup.add(() => ran.push('b'));
    expect(cleanup.size).toBe(2);

    cleanup.dispose();
    cleanup.dispose();

    expect(ran).toEqual(['a', 'b']);
    expect(cleanup.size).toBe(0);
    expect(cleanup.disposed).toBe(true);
  });

  it('returns an unregister function', () => {
    const cleanup = new OopReactCleanup();
    const ran: string[] = [];

    const off = cleanup.add(() => ran.push('a'));
    off();
    cleanup.dispose();

    expect(ran).toEqual([]);
  });

  it('runs a disposer added after dispose immediately', () => {
    const cleanup = new OopReactCleanup();
    cleanup.dispose();
    let ran = false;

    cleanup.add(() => {
      ran = true;
    });

    expect(ran).toBe(true);
  });

  it('keeps going when one disposer throws', () => {
    const cleanup = new OopReactCleanup();
    const ran: string[] = [];

    cleanup.add(() => {
      throw new Error('boom');
    });
    cleanup.add(() => ran.push('after'));

    expect(() => cleanup.dispose()).not.toThrow();
    expect(ran).toEqual(['after']);
  });
});
