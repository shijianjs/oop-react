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

`react`, `react-dom` and `mobx` are peer dependencies: `react`/`react-dom` require `>=18.2`, `mobx` accepts
`^6.12 || ^7`. **They must be dependencies of the host project, not something the library brings in its own
`node_modules`** — see "only one mobx" below.

## Turn on decorators

`@OopReactRender()` uses the legacy decorator semantics, which the consuming project has to enable:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

Vite, esbuild, SWC and tsc all handle that combination. Babel needs `@babel/plugin-proposal-decorators` with
`legacy: true`.

## Only one mobx

Tracking is MobX's job. MobX keys its bookkeeping on a symbol **created per module instance**, so if a page holds
two copies, an observable made by copy A is not observable at all as far as copy B is concerned: B's reaction reads
it and subscribes to nothing.

Which produces the worst kind of bug: **no error, the state changes and the UI does not**, and remounting the tree
appears to fix it.

MobX itself only complains when the two copies are **incompatible** versions
(`There are multiple, different versions of MobX active`); two copies of the same version stay silent. So:

- `oop-react` declares mobx as a `peerDependencies` entry (`^6.12 || ^7`), which normally leaves one copy;
- it also checks at runtime and prints `[oop-react] N copies of mobx are loaded ...` when there are more.

Find and fix:

```bash
pnpm why mobx     # who pulled it in, how many versions
pnpm dedupe       # merge what can be merged
```

When deduping is not possible (some dependency pinned an old version), pin one version in the workspace — with
pnpm that is `pnpm-workspace.yaml`:

```yaml
overrides:
  mobx: ^7.1.4
```

npm uses `overrides` in `package.json`, yarn uses `resolutions`.

## The first component

A class, one render method, and `OopReactComponent`:

```tsx title="counter.tsx"
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

`CounterView` is a normal React component: `<CounterView />` works, and any React code can use it:

```tsx
function App() {
  return (
    <main>
      <CounterView />
    </main>
  );
}
```

## What it just did

`OopReactComponent(Counter, 'view')` does three things:

1. on mount, `new Counter(props)` once, and makes the instance's fields observable;
2. binds the instance's methods, so `this.increment` can be used as `onClick` directly;
3. renders `view()`, subscribed to the fields it reads.

So: **the instance lives as long as the component**, the constructor runs once, and nothing outside `view()`
re-runs because of a render.

## Mixing with React

What `OopReactComponent` returns is an ordinary function component, and a class's JSX can contain ordinary React
components:

```tsx
import {DatePicker} from 'antd';

class Filter {
  range: [string, string] | null = null;

  @OopReactRender()
  view() {
    return <DatePicker.RangePicker onChange={(value) => this.setRange(value)} />;
  }

  setRange(value: [string, string] | null): void {
    this.range = value;
  }
}
```

Third-party components work as usual; only the state lives on the object instead of in hooks.

Next: [state](./guide/state.md).
