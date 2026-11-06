import {act, fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {
  OopReactCallback,
  OopReactComponent,
  OopReactObservable,
  OopReactObserver,
  OopReactRender,
} from '../src/index';

describe('OopReactComponent', () => {
  it('constructs the instance once and passes props to the constructor', () => {
    const contexts: unknown[] = [];

    class Field {
      value: string;

      constructor(props: {initial: string}) {
        this.value = props.initial;
        contexts.push(this);
      }

      @OopReactRender()
      view() {
        return <p>{this.value}</p>;
      }
    }

    const FieldView = OopReactComponent(Field, 'view');
    const {rerender} = render(<FieldView initial="a" />);

    expect(screen.getByText('a')).toBeTruthy();

    rerender(<FieldView initial="b" />);

    // The instance survives, so the constructor does not re-run and the value
    // the class holds is still the one it was built with.
    expect(contexts).toHaveLength(1);
    expect(screen.getByText('a')).toBeTruthy();
  });

  it('forwards props changes through onPropsChange into a method', () => {
    class Sync {
      label = '';

      sync(props: {label: string}): void {
        this.label = props.label;
      }

      @OopReactRender()
      view() {
        return <p>{this.label}</p>;
      }
    }

    const SyncView = OopReactComponent(Sync, 'view', {
      onPropsChange: (instance, props: {label: string}) => instance.sync(props),
    });

    const {rerender} = render(<SyncView label="first" />);
    expect(screen.getByText('first')).toBeTruthy();

    rerender(<SyncView label="second" />);
    expect(screen.getByText('second')).toBeTruthy();
  });

  it('uses a shared observable instance from several components', () => {
    class Store {
      count = 0;

      increment(): void {
        this.count += 1;
      }
    }

    const store = OopReactObservable(new Store());

    class Badge {
      @OopReactRender()
      view() {
        return <output>{store.count}</output>;
      }
    }

    const BadgeView = OopReactComponent(Badge, 'view', {autoObservable: false});

    render(
      <div>
        <BadgeView />
        <button type="button" onClick={() => store.increment()}>
          bump
        </button>
      </div>,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('status').textContent).toBe('1');
  });
});

describe('OopReactObserver and OopReactCallback', () => {
  it('subscribes a plain render prop', () => {
    class Model {
      text = 'idle';

      busy(): void {
        this.text = 'busy';
      }
    }
    const model = OopReactObservable(new Model());

    const Row = () => OopReactObserver(() => <span>{model.text}</span>);
    const {rerender} = render(<Row />);

    expect(screen.getByText('idle')).toBeTruthy();

    act(() => {
      model.busy();
    });
    rerender(<Row />);

    expect(screen.getByText('busy')).toBeTruthy();
  });

  it('wraps a callback into an island', () => {
    class Model {
      label = 'row';
    }
    const model = OopReactObservable(new Model());

    const renderRow = OopReactCallback((index: number) => (
      <li>
        {model.label} {index}
      </li>
    ));

    function List() {
      return <ul>{renderRow(3)}</ul>;
    }

    render(<List />);

    expect(screen.getByText('row 3')).toBeTruthy();
  });
});
