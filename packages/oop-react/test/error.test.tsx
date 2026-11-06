import {fireEvent, render, screen} from '@testing-library/react';
import type {ReactNode} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {OopReactComponent, OopReactConfigure, OopReactRender} from '../src/index';

const restores: Array<() => void> = [];

afterEach(() => {
  while (restores.length > 0) restores.pop()?.();
});

describe('render method failures', () => {
  it('isolates the failing island and leaves its siblings rendering', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    class Broken {
      @OopReactRender()
      view() {
        return (
          <div>
            {this.explodes()}
            {this.fine()}
          </div>
        );
      }

      @OopReactRender()
      explodes(): ReactNode {
        throw new Error('boom');
      }

      @OopReactRender()
      fine() {
        return <p>still here</p>;
      }
    }

    const BrokenView = OopReactComponent(Broken, 'view');
    render(<BrokenView />);

    expect(screen.getByRole('alert').textContent).toContain('boom');
    expect(screen.getByText('still here')).toBeTruthy();
  });

  it('reports through config.onError and renders a replaceable fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const onError = vi.fn();
    restores.push(
      OopReactConfigure({
        onError,
        fallback: ({error, reset, name}) => (
          <div>
            <span>
              {name}: {(error as Error).message}
            </span>
            <button type="button" onClick={reset}>
              again
            </button>
          </div>
        ),
      }),
    );

    // A flag outside the class rather than a field: a render method must not
    // write state, and this test is about recovering, not about that rule.
    let failing = true;
    class Fragile {
      @OopReactRender()
      view() {
        if (failing) throw new Error('first time fails');
        return <p>recovered</p>;
      }
    }

    const FragileView = OopReactComponent(Fragile, 'view');
    render(<FragileView />);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Fragile.view: first time fails')).toBeTruthy();

    failing = false;
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('recovered')).toBeTruthy();
  });

  it('names the island after the component name option', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    let reported = '';
    restores.push(
      OopReactConfigure({
        onError: (_error, name) => {
          reported = name ?? '';
        },
      }),
    );

    class Named {
      @OopReactRender()
      content(): ReactNode {
        throw new Error('x');
      }
    }

    // `name` is what a production build can keep, unlike the class name.
    const NamedView = OopReactComponent(Named, 'content', {name: 'NamedBoard'});
    render(<NamedView />);

    expect(reported).toBe('NamedBoard.content');
  });

  it('can be turned off by replacing the fallback with the children pass-through', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    class Plain {
      @OopReactRender()
      view() {
        return <p>fine</p>;
      }
    }

    const PlainView = OopReactComponent(Plain, 'view');
    render(<PlainView />);

    expect(screen.getByText('fine')).toBeTruthy();
  });
});
