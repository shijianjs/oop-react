---
id: render-methods
title: Render methods
slug: /guide/render-methods
---

A render method is an **island**: its own subscription, its own error boundary, its own re-render scope.

## Where the boundary is

```tsx
class Panel {
  count = 0;
  note = '';

  @OopReactRender()
  view() {
    return (
      <section>
        {this.counter()}
        {this.editor()}
      </section>
    );
  }

  @OopReactRender()
  counter() {
    return <button onClick={() => this.bump()}>{this.count}</button>;
  }

  @OopReactRender()
  editor() {
    return <input value={this.note} onChange={(event) => this.setNote(event.target.value)} />;
  }

  bump(): void {
    this.count += 1;
  }

  setNote(value: string): void {
    this.note = value;
  }
}
```

- `view()` reads nothing, so it renders once and never again;
- `counter()` reads `count`, so `bump()` re-renders only it;
- `editor()` reads `note`, so typing re-renders only it.

Calling `this.counter()` inside `view()` does not return a component tag but an element that is already subscribed.
Nesting therefore needs no extra syntax — it looks exactly like a method call.

## Arguments

Render methods can take arguments, passed straight through:

```tsx
class Rows {
  items: Row[] = [];

  @OopReactRender()
  view() {
    return <ul>{this.items.map((item) => this.row(item))}</ul>;
  }

  @OopReactRender()
  row(item: Row) {
    return <li key={item.id}>{item.title}</li>;
  }
}
```

An argument is input for that render; it does not become part of the subscription. When the list changes,
`view()` re-renders and calls `row(item)` again, and each `row` subscribes to whatever it reads.

## Do not write state in a render method

A render method runs while React is rendering, and writing state there invalidates the subscription mid-render. The
rule is simple: **read state and produce JSX here, write state somewhere else.**

```tsx
// Don't
@OopReactRender()
view() {
  this.renders += 1;   // writing state → invalidation during render
  return <p>{this.renders}</p>;
}
```

If you only want to observe how often something rendered, count into a plain object (not on the instance, so it is
not subscribed):

```tsx
const stats = {renders: 0};

@OopReactRender()
view() {
  stats.renders += 1;
  return <p>{stats.renders}</p>;
}
```

## Without a class

Two function-based entry points, with the same semantics.

`OopReactObserver` turns a function that returns JSX into an island subscribed to what it reads:

```tsx
function Total() {
  return OopReactObserver(() => <strong>{cart.items.length}</strong>);
}
```

`OopReactCallback` wraps a callback that renders an island when called (the render-prop shape):

```tsx
const renderRow = OopReactCallback((item: Row) => <li key={item.id}>{item.title}</li>);

function List({rows}: {rows: Row[]}) {
  return <ul>{rows.map(renderRow)}</ul>;
}
```

Both use React hooks, so they must be called during a render — not from an event handler.

## Naming

Every island is named `<component name>.<method name>`:

- the component name defaults to the class name, but a production build minifies that into `zD` — pass one when a
  human is going to read it: `OopReactComponent(Class, 'view', {name: 'CounterView'})`;
- that name is also what React DevTools shows, what `config.onError` receives as its second argument, and what the
  fallback prints as the origin (`CounterView.list`). See [error handling](./errors.md).
