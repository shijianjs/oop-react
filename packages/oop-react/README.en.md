# oop-react

[简体中文](https://github.com/shijianjs/oop-react/blob/main/packages/oop-react/README.md) | **English**

An object-oriented way to organise React logic: state and behaviour live in a plain class, `@OopReactRender()` marks
which methods are UI, and everything else is ordinary object code. Those classes can be `new`ed anywhere and hold
each other — React appears once, at the edge.

```tsx
import {OopReactObservable, OopReactRender} from 'oop-react';

class Cart {
  items: Item[] = [];

  constructor() {
    OopReactObservable(this);
  }

  add(item: Item): void {
    this.items.push(item);
  }

  @OopReactRender()
  view() {
    return <ul>{this.items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>;
  }
}

const cart = new Cart();

export function CartView() {
  return cart.view();
}
```

## Install

```bash
pnpm add oop-react
```

`react` / `react-dom` (`>=18.2`) and `mobx` (`^6.12 || ^7`) are peer dependencies.

> **Only one copy of mobx.** Each copy keys its bookkeeping on its own symbol, so an observable made by copy A is not
> observable to copy B: the state changes, the UI does not, and nothing is reported. Check with `pnpm why mobx`, then
> `pnpm dedupe` or pin one version through `overrides`; oop-react warns in the console when it finds more than one.

Decorators use the legacy semantics, so the consuming project needs:

```json
{"compilerOptions": {"experimentalDecorators": true}}
```

## What it solves

- **A field is the state**: `this.count += 1` is the update, and what you read is always the current value — no
  setters, no snapshots.
- **A method is the callback**: instance methods are bound in the constructor, so `onClick={this.save}` is passed
  directly and the reference never changes — no `useCallback`.
- **Re-rendering has a boundary**: a class can have any number of render methods; each is an island that subscribes
  only to what it reads and carries its own error boundary.
- **The object graph organises the logic**: parent/child/grandchild, one-to-one and one-to-many are plain
  references, so a grandchild can write its grandparent's field — no lifting state, no callback threading, no
  context, no refs.
- **Observability belongs to the class**: `OopReactObservable(this, {api: false})` in the constructor, with the
  excluded field names constrained by `keyof T` — a typo is a compile error.

## API

| Export | Purpose |
| --- | --- |
| `OopReactRender(options?)` | decorator: turns a method returning JSX into an island (`name` / `key` optional) |
| `OopReactObservable(instance, annotations?, options?)` | declare observability in a state class's constructor (typed `makeAutoObservable`) |
| `OopReactObserver(render)` | function entry point: subscribe a function that returns JSX |
| `OopReactCallback(render)` | function entry point: wrap a callback as a render prop |
| `OopReactComponent(Class, method, options?)` | the bridge: mount a class as a React component (incremental adoption) |
| `OopReactErrorBoundary` | a boundary to wrap a piece of hand-written JSX |
| `OopReactConfigure({fallback, onError})` | global failure presentation and reporting |

Full docs: [English](https://shijianjs.github.io/oop-react/en/) · [中文](https://shijianjs.github.io/oop-react/) .
Live demo: https://shijianjs.github.io/oop-react/demo/ .

## Dependencies

Tracking is [MobX](https://mobx.js.org/), used directly: import `computed`, `flow`, `reaction`, `toJS` from `mobx` —
the library does not wrap them. The library itself depends on no UI kit.

## License

MIT
