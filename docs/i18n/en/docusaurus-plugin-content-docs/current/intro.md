---
id: intro
title: What it solves
slug: /intro
sidebar_position: 1
---

React's function components separate state from the thing that owns it: state lives in hook slots, the component
function runs again on every render, and `useCallback`, `useMemo`, dependency arrays, `useRef` and stale closures
become patches you have to memorise. The more logic a component holds, the longer the function gets — and pulling
out a child means lifting state up and passing callbacks down.

oop-react organises it differently: **state and behaviour stay in one instance of a plain class, and only methods
marked `@OopReactRender()` re-render**.

```tsx title="The same component, two ways"
// hooks: state, callbacks and dependencies all live in the component function
function Counter() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((value) => value + 1), []);
  return <button onClick={increment}>{count}</button>;
}

// oop-react: state and callbacks are members of the instance
class Counter {
  count = 0;

  increment(): void {
    this.count += 1;
  }

  @OopReactRender()
  view() {
    return <button onClick={this.increment}>{this.count}</button>;
  }
}

export const CounterView = OopReactComponent(Counter, 'view');
```

The class on the right needs no `useCallback`: `this.increment` is a method already bound to the instance, so the
reference never changes. It needs no dependency array either: `view()` reads `count`, so a change to `count`
re-renders exactly that method and nothing else.

## Three rules

**Fields are state.** `count = 0` lives on the class; changing it is `this.count += 1`. No setter function, no
snapshot of a past render — what you read is the current value.

**Methods are behaviour.** Code that changes state lives in methods, and a button calls a method. Logic stays on
the object instead of being scattered across arrow functions in JSX.

**`@OopReactRender()` is the render boundary.** A class can have as many render methods as you like, and each one
is an independent island: it subscribes to the fields it reads, and it has its own error boundary. Islands nest, so
the granularity is yours to choose.

```tsx title="One class, several islands"
class Board {
  title = "Today's list";
  items: string[] = [];

  @OopReactRender()
  view() {
    return (
      <section>
        {this.header()}   {/* re-renders only when title changes */}
        {this.list()}     {/* re-renders only when items changes */}
      </section>
    );
  }

  @OopReactRender()
  header() {
    return <h2>{this.title}</h2>;
  }

  @OopReactRender()
  list() {
    return <ul>{this.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  }
}
```

## What it gives up

Being honest about the trade-off beats wishful thinking:

- **It is not "React without React".** The component tree, JSX, React DevTools and the ecosystem all stay. What is
  given up is "the component function re-runs every frame" as an organising principle, in exchange for a stable
  instance context.
- **Re-rendering relies on fine-grained subscription; the default implementation is MobX.** Don't want it? Swap
  it, see [replacing the defaults](./guide/configure.md).
- **Decorators use the legacy semantics** (`experimentalDecorators`). TypeScript 5, 6 and 7 all support it, but the
  flag has to be on in `tsconfig.json`. Prefer not to? `OopReactObserver` and `OopReactCallback` are the equivalent
  function-based entry points.
- **`props` is not the main channel.** Objects hold each other and call methods; `props` exists to seed the
  constructor.

Next: [getting started](./getting-started.md).
