import {render} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {OopReactComponent, OopReactRender} from '../src/index';

describe('duplicate mobx copies', () => {
  it('warns once, with the fix, when the page holds more than one copy', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Two copies in one page is what `__mobxInstanceCount > 1` means; a real
    // duplicate sets it during import, which a unit test cannot reproduce
    // without installing a second copy of mobx.
    const globals = globalThis as {__mobxInstanceCount?: number};
    const original = globals.__mobxInstanceCount;
    globals.__mobxInstanceCount = 2;

    class Counter {
      count = 0;

      @OopReactRender()
      view() {
        return <p>{this.count}</p>;
      }
    }

    const CounterView = OopReactComponent(Counter, 'view');
    render(
      <>
        <CounterView />
        <CounterView />
      </>,
    );

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('copies of mobx');

    globals.__mobxInstanceCount = original;
  });
});
