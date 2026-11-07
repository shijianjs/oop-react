import {fireEvent, render, screen} from '@testing-library/react';
import {useState} from 'react';
import {describe, expect, it} from 'vitest';
import {OopReactObservable, OopReactRender} from '../src/index';

// Plain counters, not observable: printing them proves a render happened
// without causing one.
const renders = {parent: 0, child: 0, sibling: 0};

class Panel {
  title = 'hello';
  child = new Child();
  sibling = new Sibling();

  constructor() {
    OopReactObservable(this, {child: false, sibling: false});
  }

  rename(): void {
    this.title = this.title === 'hello' ? 'changed' : 'hello';
  }

  @OopReactRender()
  view() {
    renders.parent += 1;
    return (
      <section>
        <button type="button" onClick={this.rename}>
          {this.title}
        </button>
        {this.child.view()}
        {this.sibling.view()}
      </section>
    );
  }
}

class Child {
  count = 0;
  label = 'child';

  constructor() {
    OopReactObservable(this);
  }

  bump(): void {
    this.count += 1;
  }

  @OopReactRender()
  view() {
    renders.child += 1;
    return (
      <button type="button" aria-label="child" onClick={this.bump}>
        {this.label}: {this.count}
      </button>
    );
  }
}

class Sibling {
  text = 'sibling';

  constructor() {
    OopReactObservable(this);
  }

  @OopReactRender()
  view() {
    renders.sibling += 1;
    return <output aria-label="sibling">{this.text}</output>;
  }
}

describe('island isolation', () => {
  it('does not re-run a child island when its parent re-renders', () => {
    const panel = new Panel();
    const Page = () => panel.view();

    render(<Page />);

    const before = {...renders};
    fireEvent.click(screen.getByRole('button', {name: 'hello'}));

    // The parent island re-rendered — that is what the click changed…
    expect(renders.parent).toBe(before.parent + 1);
    // …but the children were skipped, because their own state did not move.
    expect(renders.child).toBe(before.child);
    expect(renders.sibling).toBe(before.sibling);
    expect(screen.getByRole('button', {name: 'changed'})).toBeTruthy();
  });

  it('still re-runs a child island when its own state changes', () => {
    const panel = new Panel();
    const Page = () => panel.view();

    render(<Page />);

    const before = {...renders};
    fireEvent.click(screen.getByRole('button', {name: 'child'}));

    expect(renders.child).toBe(before.child + 1);
    expect(renders.parent).toBe(before.parent);
    expect(renders.sibling).toBe(before.sibling);
  });

  it('re-runs a child island when the call arguments change', () => {
    class Rows {
      offset = 0;

      constructor() {
        OopReactObservable(this);
      }

      shift(): void {
        this.offset += 1;
      }

      @OopReactRender()
      view() {
        return (
          <div>
            <button type="button" onClick={this.shift}>
              shift
            </button>
            {this.row(this.offset)}
          </div>
        );
      }

      @OopReactRender({key: (_self: Rows, offset: number) => offset})
      row(offset: number) {
        renders.sibling += 1;
        return <span>row {offset}</span>;
      }
    }

    const rows = new Rows();
    const Page = () => rows.view();
    render(<Page />);

    const before = renders.sibling;
    fireEvent.click(screen.getByRole('button', {name: 'shift'}));

    expect(renders.sibling).toBe(before + 1);
    expect(screen.getByText('row 1')).toBeTruthy();
  });

  it('gives every island its own identity when a parent swaps one for another', () => {
    // Every island element has the same component type, so React reuses the fiber
    // for whatever occupies the same position. Without the default key, swapping
    // in a method that calls a different number of hooks throws
    // "Rendered more hooks than during the previous render".
    class WithHook {
      @OopReactRender()
      view() {
        const [count] = useState(0);
        return <p>hook: {count}</p>;
      }
    }

    class WithoutHook {
      @OopReactRender()
      view() {
        return <p>plain</p>;
      }
    }

    const withHook = new WithHook();
    const withoutHook = new WithoutHook();
    const Page = ({which}: {which: 'hook' | 'plain'}) =>
      which === 'hook' ? withHook.view() : withoutHook.view();

    const {rerender} = render(<Page which="hook" />);
    expect(screen.getByText('hook: 0')).toBeTruthy();

    rerender(<Page which="plain" />);
    expect(screen.getByText('plain')).toBeTruthy();

    rerender(<Page which="hook" />);
    expect(screen.getByText('hook: 0')).toBeTruthy();
  });
});
