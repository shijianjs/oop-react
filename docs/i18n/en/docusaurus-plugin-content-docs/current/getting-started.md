---
id: getting-started
title: Getting started
slug: /getting-started
sidebar_position: 2
---

## Install

```bash
pnpm add oop-react
```

`react`, `react-dom` (`>=18.2`), `mobx` (`^7`) and `mobx-react-lite` (`^5`) are peer dependencies and have to come
from the host project — see "only one mobx" below. Tracking is MobX, and the React binding is the official
`mobx-react-lite` (`observer`), not a hand-written `Reaction` loop.

## Turn on decorators

`@OopReactRender()` uses the legacy decorator semantics:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

Vite, esbuild, SWC and tsc all handle that combination; Babel needs `@babel/plugin-proposal-decorators` with
`legacy: true`.

## Only one mobx

MobX keys its bookkeeping on a symbol **created per module instance**, so two copies on one page mean "the
observable copy A made is not observable as far as copy B is concerned" — no error, the state changes and the UI
does not. MobX itself only complains when the two copies are **incompatible** versions.

`oop-react` declares mobx as a peer (`^7`) and warns at runtime when it finds more than one copy. `mobx-react-lite` is
a peer too, and it has to share that same copy — otherwise the reactions `observer` creates cannot see your
observables:

```bash
pnpm why mobx     # who pulled it in, how many versions
pnpm dedupe
```

When deduping is impossible, pin one version: `overrides: {mobx: ^7.1.4}` in `pnpm-workspace.yaml` (npm:
`overrides` in `package.json`, yarn: `resolutions`).

## One object

A state class declares what state it has, in its own constructor:

```tsx title="counter.tsx"
import {OopReactObservable, OopReactRender} from 'oop-react';

export class Counter {
  count = 0;

  constructor() {
    OopReactObservable(this);
  }

  increment(): void {
    this.count += 1;
  }

  @OopReactRender()
  view() {
    return <button onClick={this.increment}>{this.count}</button>;
  }
}
```

It is created outside React and wired in with one line:

```tsx title="app.tsx"
import {Counter} from './counter';

const counter = new Counter();

export function App() {
  return counter.view();
}
```

`App` has no state, no props and no hooks. `counter` lives at module scope (in a test it is just
`new Counter()`), and `view()` subscribes to the `count` it reads.

## When it has to be a component

When you need a real component — somebody mounts `<CounterView />`, or you are inserting the graph into an existing
React page:

```tsx
import {OopReactComponent} from 'oop-react';

export const CounterView = OopReactComponent(Counter, 'view');
```

`OopReactComponent` runs `new Counter(props)` and hands props to the constructor. This is the **bridge**, not the
main path; see [the React bridge](./guide/react-bridge.md).

Next: [the object graph](./guide/structure.md).
