# oop-react

[简体中文](https://github.com/shijianjs/oop-react/blob/main/packages/oop-react/README.md) | **English**

An object-oriented way to organise a React UI: state and behaviour live in a plain class, and **only methods
marked `@OopReactRender()` re-render**.

```tsx
import {OopReactComponent, OopReactRender} from 'oop-react';

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

export const CounterView = OopReactComponent(Counter, 'view');
```

## Install

```bash
pnpm add oop-react
```

`react` / `react-dom` (`>=18.2`) and `mobx` (`^6.12 || ^7`) are peer dependencies.

> **Only one copy of mobx.** MobX keys its bookkeeping on a per-module-instance symbol, so two copies on one page
> give you "state changed, UI did not" — silently. Check with `pnpm why mobx`, then `pnpm dedupe` or pin one
> version through `overrides`; oop-react warns in the console when it detects more than one copy.

Decorators use the legacy semantics, so the consuming project needs:

```json
{"compilerOptions": {"experimentalDecorators": true}}
```

## What it solves

- **State needs no external home.** A field is the state: `this.count += 1` is the update, and what you read is
  always the current value.
- **Callbacks need no memoising.** Instance methods are already bound, so `this.increment` is passed straight to
  `onClick` and the reference never changes — no `useCallback`.
- **Re-rendering has a boundary.** A class can have as many render methods as it likes; each is an island that
  subscribes only to the fields it reads and carries its own error boundary.
- **Logic does not move.** Objects hold each other and call methods directly — no lifting state, no threading
  callbacks down, no context.

## API

| Export | Purpose |
| --- | --- |
| `OopReactRender()` | decorator: turns a method that returns JSX into an island |
| `OopReactComponent(Class, method, options?)` | class + render method → React component |
| `OopReactObserver(render)` | function entry point: subscribe a function that returns JSX |
| `OopReactCallback(render)` | function entry point: wrap a callback as a render prop |
| `OopReactObservable(instance, options?)` | make an instance created outside a component observable |
| `OopReactErrorBoundary` | a boundary to wrap a piece of hand-written JSX |
| `OopReactConfigure(patch)` | replace subscription, observability, fallback, error reporting |

Full docs: [English](https://shijianjs.github.io/oop-react/en/) · [中文](https://shijianjs.github.io/oop-react/) .
Live demo: https://shijianjs.github.io/oop-react/demo/ .

## Defaults

Observability and subscription default to [MobX](https://mobx.js.org/) (`makeAutoObservable` + `Reaction`).
Replace it with `OopReactConfigure({observe, observable})` if you prefer; the library itself depends on no UI kit.

## License

MIT
