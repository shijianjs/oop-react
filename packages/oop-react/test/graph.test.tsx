import {fireEvent, render, screen} from '@testing-library/react';
import {isObservableProp} from 'mobx';
import {describe, expect, it, vi} from 'vitest';
import {OopReactObservable, OopReactRender} from '../src/index';

// Counters live outside the classes: a plain object is not observable, so
// printing them proves a render happened without causing one.
const renders = {log: 0, counter: 0, todos: 0};

class ActivityLog {
  entries: string[] = [];

  constructor() {
    OopReactObservable(this);
  }

  add(entry: string): void {
    this.entries.push(entry);
  }

  @OopReactRender()
  view() {
    renders.log += 1;
    return (
      <ul aria-label="log">
        {this.entries.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ul>
    );
  }
}

class CounterCard {
  count = 0;
  readonly workshop: Workshop;

  constructor(workshop: Workshop) {
    this.workshop = workshop;
    // The reference to the parent is not state: the parent declares its own
    // observability, and observing it again from here would be wrong.
    OopReactObservable(this, {workshop: false});
  }

  bump(): void {
    this.count += 1;
    this.workshop.log.add(`counter=${this.count}`);
  }

  @OopReactRender()
  view() {
    renders.counter += 1;
    return (
      <button type="button" onClick={this.bump}>
        count: {this.count}
      </button>
    );
  }
}

class TodoItem {
  readonly title: string;
  readonly board: TodoBoard;
  done = false;

  constructor(title: string, board: TodoBoard) {
    this.title = title;
    this.board = board;
    OopReactObservable(this, {title: false, board: false});
  }

  toggle(): void {
    this.done = !this.done;
    // A grandchild writing to a sibling of its grandparent: no callback, no
    // context, just a reference.
    this.board.workshop.log.add(`${this.title} → ${this.done ? 'done' : 'open'}`);
  }

  // The row is one entry of a list, and only the decorator can put a key on the
  // element it creates — so identity is declared where it belongs.
  @OopReactRender({key: (self: TodoItem) => self.title})
  row() {
    return (
      <li>
        <input type="checkbox" checked={this.done} onChange={this.toggle} aria-label={this.title} />
        <span>{this.title}</span>
      </li>
    );
  }
}

class TodoBoard {
  draft = '';
  items: TodoItem[] = [];
  readonly workshop: Workshop;

  constructor(workshop: Workshop) {
    this.workshop = workshop;
    OopReactObservable(this, {workshop: false});
  }

  setDraft(value: string): void {
    this.draft = value;
  }

  add(): void {
    const title = this.draft.trim();
    if (title === '') return;
    this.items.push(new TodoItem(title, this));
    this.draft = '';
    this.workshop.log.add(`added ${title}`);
  }

  @OopReactRender()
  composer() {
    return (
      <input
        value={this.draft}
        aria-label="draft"
        onChange={(event) => this.setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') this.add();
        }}
      />
    );
  }

  @OopReactRender()
  list() {
    renders.todos += 1;
    return <ul aria-label="todos">{this.items.map((item) => item.row())}</ul>;
  }
}

class Workshop {
  readonly log: ActivityLog;
  readonly counter: CounterCard;
  readonly todos: TodoBoard;

  constructor() {
    // Children first, then the object that holds them declares what is state.
    this.log = new ActivityLog();
    this.counter = new CounterCard(this);
    this.todos = new TodoBoard(this);
    OopReactObservable(this, {log: false, counter: false, todos: false});
  }

  @OopReactRender()
  view() {
    return (
      <main>
        {this.counter.view()}
        {this.todos.composer()}
        {this.todos.list()}
        {this.log.view()}
      </main>
    );
  }
}

describe('an object graph, not a component tree', () => {
  it('mounts the graph through a plain React component', () => {
    const workshop = new Workshop();
    const Page = () => workshop.view();

    render(<Page />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button').textContent).toBe('count: 1');
    expect(screen.getByLabelText('log').textContent).toContain('counter=1');
  });

  it('keeps a deep child able to write to its grandparent’s sibling', () => {
    const workshop = new Workshop();
    const Page = () => workshop.view();

    render(<Page />);
    fireEvent.change(screen.getByLabelText('draft'), {target: {value: 'ship it'}});
    fireEvent.keyDown(screen.getByLabelText('draft'), {key: 'Enter'});

    expect(screen.getByLabelText('todos').textContent).toContain('ship it');
    expect(screen.getByLabelText('log').textContent).toContain('added ship it');

    fireEvent.click(screen.getByLabelText('ship it'));

    expect(screen.getByLabelText('log').textContent).toContain('ship it → done');
  });

  it('re-renders only the island whose state changed', () => {
    const workshop = new Workshop();
    const Page = () => workshop.view();

    render(<Page />);

    const before = {...renders};
    fireEvent.click(screen.getByRole('button'));

    // The counter island redrew, the log island redrew because the counter wrote
    // to it, and the todo list — which reads neither — did not run at all.
    expect(renders.counter).toBe(before.counter + 1);
    expect(renders.log).toBe(before.log + 1);
    expect(renders.todos).toBe(before.todos);
  });

  it('keys list islands the way the method declares', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const workshop = new Workshop();
    const Page = () => workshop.view();

    render(<Page />);
    for (const title of ['one', 'two', 'three']) {
      fireEvent.change(screen.getByLabelText('draft'), {target: {value: title}});
      fireEvent.keyDown(screen.getByLabelText('draft'), {key: 'Enter'});
    }

    expect(screen.getByLabelText('todos').children).toHaveLength(3);
    expect(error.mock.calls.flat().join(' ')).not.toContain('unique "key"');
  });

  it('leaves annotated fields as plain fields', () => {
    class WithService {
      api = {calls: 0};
      value = 0;

      constructor() {
        OopReactObservable(this, {api: false});
      }
    }

    const instance = new WithService();

    expect(isObservableProp(instance, 'value')).toBe(true);
    expect(isObservableProp(instance, 'api')).toBe(false);
  });

  it('rejects annotation keys that are not fields', () => {
    class Typed {
      count = 0;

      constructor() {
        // @ts-expect-error — `typo` is not a field of Typed
        OopReactObservable(this, {typo: false});
      }
    }

    expect(new Typed().count).toBe(0);
  });
});
