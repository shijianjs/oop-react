import {fireEvent, render, screen} from '@testing-library/react';
import type {ReactElement} from 'react';
import {describe, expect, it} from 'vitest';
import {OopReactCallback, OopReactComponent, OopReactObserver, OopReactRender} from '../src/index';

describe('@OopReactRender', () => {
  it('re-renders the decorated method when the state it reads changes', () => {
    class Counter {
      count = 0;

      increment(): void {
        this.count += 1;
      }

      @OopReactRender()
      view() {
        return (
          <button type="button" onClick={this.increment}>
            count: {this.count}
          </button>
        );
      }
    }

    const CounterView = OopReactComponent(Counter, 'view');
    render(<CounterView />);

    const button = screen.getByRole('button');
    expect(button.textContent).toBe('count: 0');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(button.textContent).toBe('count: 2');
  });

  it('keeps a re-render inside the island whose state changed', () => {
    const renders = {left: 0, right: 0};

    class Dashboard {
      left = 0;
      right = 0;

      bumpLeft(): void {
        this.left += 1;
      }

      @OopReactRender()
      view() {
        return (
          <div>
            {this.leftPanel()}
            {this.rightPanel()}
          </div>
        );
      }

      @OopReactRender()
      leftPanel() {
        renders.left += 1;
        return (
          <button type="button" aria-label="left" onClick={this.bumpLeft}>
            left: {this.left}
          </button>
        );
      }

      @OopReactRender()
      rightPanel() {
        renders.right += 1;
        return <output aria-label="right">right: {this.right}</output>;
      }
    }

    const DashboardView = OopReactComponent(Dashboard, 'view');
    render(<DashboardView />);

    const leftBefore = renders.left;
    const rightBefore = renders.right;

    fireEvent.click(screen.getByLabelText('left'));

    expect(renders.left).toBe(leftBefore + 1);
    expect(renders.right).toBe(rightBefore);
    expect(screen.getByLabelText('right').textContent).toBe('right: 0');
  });

  it('passes arguments through to the method', () => {
    class Greeting {
      @OopReactRender()
      view(name: string) {
        return <p>hello {name}</p>;
      }
    }

    const greeting = new Greeting();
    const Host = () => <>{greeting.view('world')}</>;
    render(<Host />);

    expect(screen.getByText('hello world')).toBeTruthy();
  });

  it('tracks nested arrays, not only field reassignment', () => {
    class TodoList {
      items: string[] = [];

      add(item: string): void {
        this.items.push(item);
      }

      @OopReactRender()
      view() {
        return (
          <div>
            <button type="button" onClick={() => this.add('ship it')}>
              add
            </button>
            <ul>
              {this.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        );
      }
    }

    const TodoView = OopReactComponent(TodoList, 'view');
    render(<TodoView />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('ship it')).toBeTruthy();
  });
});

describe('@OopReactRender key', () => {
  it('takes a field name, checked against the instance', () => {
    class Row {
      constructor(
        readonly id: number,
        readonly title: string,
      ) {}

      @OopReactRender<Row>({key: 'id'})
      row() {
        return <li>{this.title}</li>;
      }
    }

    const rows = [new Row(1, 'a'), new Row(2, 'b')];

    expect(rows.map((item) => (item.row() as ReactElement).key)).toEqual(['1', '2']);
  });

  it('reads the field from the first argument when a parent renders the row', () => {
    class Row {
      constructor(
        readonly id: number,
        readonly title: string,
      ) {}
    }

    class Board {
      @OopReactRender<Board, [Row]>({key: 'id'})
      row(item: Row) {
        return <li>{item.title}</li>;
      }
    }

    const board = new Board();
    const keys = [new Row(1, 'a'), new Row(2, 'b')].map(
      (item) => (board.row(item) as ReactElement).key,
    );

    expect(keys).toEqual(['1', '2']);
  });

  it('still takes a function, including the call arguments', () => {
    class Board {
      @OopReactRender<Board>({key: (_self, id: string) => `r-${id}`})
      row(id: string) {
        return <li>{id}</li>;
      }
    }

    const board = new Board();

    expect((board.row('x') as ReactElement).key).toBe('r-x');
  });
});

describe('functional islands', () => {
  it('takes a key on OopReactObserver', () => {
    const element = OopReactObserver(() => <span>total</span>, {key: 'total'}) as ReactElement;

    expect(element.key).toBe('total');
  });

  it('derives the key from the call arguments in OopReactCallback', () => {
    const renderRow = OopReactCallback((item: {id: number}) => <li>{item.id}</li>, {
      key: (item) => item.id,
    });

    expect((renderRow({id: 7}) as ReactElement).key).toBe('7');
  });
});
