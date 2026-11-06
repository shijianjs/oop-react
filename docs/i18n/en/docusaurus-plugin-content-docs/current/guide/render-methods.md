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
    return <button onClick={this.bump}>count: {this.count}</button>;
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

- `view()` reads nothing, so it renders once;
- `counter()` reads `count`, so `bump()` re-renders only it;
- `editor()` reads `note`, so typing re-renders only it.

`this.counter()` inside `view()` does not return a component tag but an element that is already subscribed —
nesting needs no extra syntax.

## Where you can draw one

An island's element is an ordinary React element and creating it has no side effects, so it can be produced anywhere:

```tsx
// in a plain component
export function PanelView() {
  return panel.view();
}

// in another object's render method
@OopReactRender()
view() {
  return <main>{this.panel.view()}</main>;
}

// in a list
@OopReactRender()
list() {
  return <ul>{this.items.map((item) => item.row())}</ul>;
}
```

But **do not call a render method from an event handler**: it returns an element for React to render, it is not a
command to render once.

## Lists and keys

The island's element is created by the decorator, so the caller has no element to put a `key` on — the key is
declared there instead:

```tsx
// the object renders itself: its identity is its own
@OopReactRender({key: (self: TodoItem) => self.title})
row() {
  return <li>{this.title}</li>;
}

// the parent renders rows for its children: identity comes from the argument
@OopReactRender({key: (_self: TodoBoard, item: TodoItem) => item.id})
row(item: TodoItem) {
  return <li>{item.title}</li>;
}
```

The key function receives the instance first, then the call arguments.

## Naming

An island is named `<class name>.<method name>`; that is what React DevTools shows, what the fallback prints and
what `onError` receives. A production build minifies the class name, so name the ones a human will read:

```tsx
@OopReactRender({name: 'FlakySection'})   // → FlakySection.content
content() { … }
```

`OopReactComponent(Class, 'view', {name: 'CounterView'})` sets a prefix for every island of that class.

## Do not write state in a render method

A render method runs while React renders, and writing state there invalidates the subscription mid-render. The rule:
**read state and produce JSX here; write state somewhere else.**

```tsx
// Don't
@OopReactRender()
view() {
  this.renders += 1;   // writing state during a render
  return <p>{this.renders}</p>;
}
```

To count renders, use a plain object (not on the instance, so it is not subscribed):

```ts
const stats = {renders: 0};

@OopReactRender()
view() {
  stats.renders += 1;
  return <p>{stats.renders}</p>;
}
```

## Without a class

`OopReactObserver` turns a function that returns JSX into an island subscribed to what it reads:

```tsx
function Total() {
  return OopReactObserver(() => <strong>{cart.items.length}</strong>);
}
```

`OopReactCallback` wraps a callback that renders an island when called — the render-prop shape:

```tsx
const renderRow = OopReactCallback((item: Item) => <li key={item.id}>{item.title}</li>);

function List({items}: {items: Item[]}) {
  return <ul>{items.map(renderRow)}</ul>;
}
```

Both use hooks, so they must be called during a render — not from an event handler.

A render method itself may call hooks too (it is a component). For providers, `Form.useForm` and `App.useApp`, see
[complex components and hooks](./complex-components.md).
