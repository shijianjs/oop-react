import {autorun, isObservableProp, reaction} from 'mobx';
import {describe, expect, it, vi} from 'vitest';
import {OopReactIgnore, OopReactObservable, OopReactState} from '../src/index';

describe('OopReactObservable', () => {
  it('marks fields observable, methods actions and getters computed', () => {
    class Counter {
      count = 0;
      step = 2;

      constructor() {
        OopReactObservable(this);
      }

      get doubled(): number {
        return this.count * 2;
      }

      increment(): void {
        this.count += this.step;
      }
    }

    const counter = new Counter();
    const seen: number[] = [];
    const stop = autorun(() => seen.push(counter.doubled));

    counter.increment();
    stop();

    expect(isObservableProp(counter, 'count')).toBe(true);
    // A computed, not a subscription per read: one run per change.
    expect(seen).toEqual([0, 4]);
  });

  it('leaves fields marked with @OopReactIgnore alone', () => {
    class Cart {
      @OopReactIgnore readonly api = {calls: 0};
      @OopReactIgnore board = {rows: [] as number[]};
      items: number[] = [];

      constructor() {
        OopReactObservable(this);
      }
    }

    const cart = new Cart();

    expect(isObservableProp(cart, 'items')).toBe(true);
    expect(isObservableProp(cart, 'api')).toBe(false);
    expect(isObservableProp(cart, 'board')).toBe(false);
  });

  it('applies @OopReactIgnore declared on a base class', () => {
    class Base {
      @OopReactIgnore readonly service = {calls: 0};
      base = 0;

      constructor() {
        OopReactObservable(this);
      }
    }

    class Derived extends Base {
      derived = 0;

      constructor() {
        super();
        OopReactObservable(this);
      }
    }

    const instance = new Derived();

    expect(isObservableProp(instance, 'base')).toBe(true);
    expect(isObservableProp(instance, 'derived')).toBe(true);
    expect(isObservableProp(instance, 'service')).toBe(false);
  });

  it('annotates base-class methods as actions too', () => {
    class Base {
      count = 0;

      constructor() {
        OopReactObservable(this);
      }

      bump(): void {
        this.count += 1;
      }
    }

    class Derived extends Base {
      other = 0;

      constructor() {
        super();
        OopReactObservable(this);
      }
    }

    const instance = new Derived();
    const seen: number[] = [];
    const stop = autorun(() => seen.push(instance.count));

    // Would warn (or throw under enforceActions) if `bump` were not an action.
    instance.bump();
    stop();

    expect(seen).toEqual([0, 1]);
  });

  it('adds getters from a base class as computed', () => {
    class Base {
      value = 1;

      constructor() {
        OopReactObservable(this);
      }

      get doubled(): number {
        return this.value * 2;
      }
    }

    class Derived extends Base {
      constructor() {
        super();
        OopReactObservable(this);
      }
    }

    const instance = new Derived();
    const seen: number[] = [];
    const stop = reaction(
      () => instance.doubled,
      (next) => seen.push(next),
    );

    instance.value = 5;
    stop();

    expect(seen).toEqual([10]);
  });

  it('still lets the annotation map override an inference', () => {
    class Mixed {
      snapshot = {rows: [] as number[]};
      keep = 0;
      @OopReactIgnore ignored = 1;

      constructor() {
        // Explicit map wins over both the inference and the decorator.
        OopReactObservable(this, {snapshot: false, ignored: true});
      }
    }

    const instance = new Mixed();

    expect(isObservableProp(instance, 'keep')).toBe(true);
    expect(isObservableProp(instance, 'snapshot')).toBe(false);
    expect(isObservableProp(instance, 'ignored')).toBe(true);
  });

  it('treats a flow field as an action and keeps it bound', () => {
    class Loader {
      state = 'idle';

      constructor() {
        OopReactObservable(this);
      }

      run(): void {
        this.state = 'done';
      }
    }

    const loader = new Loader();
    const {run} = loader;
    run();

    expect(loader.state).toBe('done');
  });
});

describe('@OopReactState', () => {
  it('makes a decorated class observable without a constructor', () => {
    @OopReactState
    class Panels {
      @OopReactIgnore readonly api = {calls: 0};
      open = false;

      toggle(): void {
        this.open = !this.open;
      }

      get label(): string {
        return this.open ? 'open' : 'closed';
      }
    }

    const panels = new Panels();
    const seen: string[] = [];
    const stop = autorun(() => seen.push(panels.label));

    const {toggle} = panels;
    toggle();
    stop();

    expect(isObservableProp(panels, 'open')).toBe(true);
    expect(isObservableProp(panels, 'api')).toBe(false);
    expect(seen).toEqual(['closed', 'open']);
  });

  it('calls init() once the instance is observable', () => {
    let observableInInit = false;

    @OopReactState
    class Boots {
      ready = false;

      init(): void {
        observableInInit = isObservableProp(this, 'ready');
        this.ready = true;
      }
    }

    const boots = new Boots();

    expect(observableInInit).toBe(true);
    expect(boots.ready).toBe(true);
  });

  it('keeps the class name and works through inheritance', () => {
    @OopReactState
    class Base {
      base = 0;

      bump(): void {
        this.base += 1;
      }
    }

    @OopReactState
    class Derived extends Base {
      extra = 0;
    }

    const instance = new Derived();
    const seen: number[] = [];
    const stop = autorun(() => seen.push(instance.base));

    const {bump} = instance;
    bump();
    stop();

    expect(Derived.name).toBe('Derived');
    expect(instance).toBeInstanceOf(Base);
    expect(isObservableProp(instance, 'extra')).toBe(true);
    expect(seen).toEqual([0, 1]);
  });
});
