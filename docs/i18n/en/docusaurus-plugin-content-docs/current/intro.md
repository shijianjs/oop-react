---
id: intro
title: What it solves
slug: /intro
sidebar_position: 1
---

React puts state inside the component function, and the component function runs again on every render. So
`useCallback`, `useMemo`, dependency arrays, `useRef` and stale closures become patches you have to memorise; the
moment logic grows, the function grows with it, and pulling out a child means lifting state up and threading
callbacks down.

oop-react changes **how the logic is organised**, not how JSX is written: state and behaviour live in a plain
class, `@OopReactRender()` marks which methods are UI, and everything else is ordinary object code. Those classes
can be `new`ed anywhere and hold each other — React appears once, at the edge.

```tsx title="One object graph, one line of React"
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

// the only React-aware thing here
export function CartView() {
  return cart.view();
}
```

`cart` is created at module scope, asserted against in tests as `new Cart()`, and held directly by whoever needs
it. It does not depend on React, and it does not depend on a component being mounted.

## Three rules

**The object graph organises the logic.** Who holds whom is a business decision: a grandchild can hold its
grandparent, one-to-many is an array. Updates travel along method calls — no lifting state into a common parent,
no context, no callback props, no event bus, no refs.

**`@OopReactRender()` is the render boundary.** A class can have any number of these methods, and each is an
**island**: it subscribes to the fields it reads and carries its own error boundary. Islands nest, so the
granularity is yours.

**React lives at the edge.** A plain function component returning `root.view()` is enough. Only when a class has to
*be* a component for somebody else's React code do you need
[`OopReactComponent`](./guide/react-bridge.md) — progressive adoption, or embedding the graph in an existing page.

## What it gives up

- **It is bound to MobX.** Tracking is MobX, and the library offers no "swap the reactive engine" seam — replacing
  it costs about as much as writing one. `makeAutoObservable`, `computed` and `reaction` are used directly;
  see [state](./guide/state.md).
- **Decorators use the legacy semantics** (`experimentalDecorators`). Prefer not to? `OopReactObserver` and
  `OopReactCallback` are the equivalent function entry points.
- **`props` is not the main channel.** Objects hold each other; props seed constructors and hand things to outside
  React code.
- **It is not "one class per component".** A class is a home for logic, not a stand-in for a component: it can have
  a dozen islands, and an island need not be attached to any component of its own.

Next: [getting started](./getting-started.md), then [the object graph](./guide/structure.md).
