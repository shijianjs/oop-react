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

## A parent re-render does not re-run its child islands

Islands are memoized: the comparison is "instance + method + name + call arguments". When a parent island re-renders
because one of *its* fields changed, child islands whose arguments did not change are skipped — they re-run when
their own fields move.

That is what makes "split it as fine as you like" true: React re-renders the whole subtree by default, and without
this memo one state change in a parent would re-execute every render method below it. Arguments are compared
**shallowly**, so `this.row(item)` re-runs when `item` is a different object; mutating a field of the same `item`
does not (that is `row()`'s own subscription).

`OopReactObserver` / `OopReactCallback` do not get this: the function they receive is created fresh on every render,
so there is nothing to compare, and they re-run when their parent does. If a block needs that isolation, make it a
decorated method.

## Wrapper components

A wrapper "like `div` / `Card`" — an outline with meaning on the outside, anything at all on the inside — needs no
`children`: let the shell object hold a **content object**, and that content is an island of its own.

```tsx title="demo/src/pages/frame/Frame.tsx"
export interface FrameContent {
  view(): ReactNode;
}

class Frame {
  tone: 'plain' | 'danger' = 'plain';   // outline as meaning: the shell's own field
  collapsed = false;
  body: FrameContent;                   // the content: another object

  @OopReactRender()
  view() {
    return (
      <section className={`frame frame--${this.tone}`}>
        <header>{/* title bar, collapse button */}</header>
        {this.collapsed ? null : this.body.view()}
      </section>
    );
  }
}
```

Three things follow:

- **Content is a type, not a node.** Anything with `view()` fits: a paragraph, a counter, a table, or another
  `Frame` — which is how nesting happens. The shell neither knows nor needs to know what is in there.
- **Each half subscribes to itself.** Changing `tone` / `collapsed` re-renders the shell while `this.body.view()`
  keeps its arguments, so the content island is skipped; a field changing inside the content re-runs only that island.
- **Swapping content is an assignment.** `frame.body = other`, with no wrapper component per content shape and no
  need to rebuild the shell.

The demo's "Wrapper" page is a handful of `Frame` instances: change the `tone`, swap the `body`, nest three deep, and
one with no title that is therefore only an outline — the same class, minus the title, is a `div`.

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
declared there instead. **Most of the time it is one field of the object**, so pass the field name (add the class as
a type argument if you want it checked):

```tsx
@OopReactRender({key: 'id'})
row() {
  return <li>{this.title}</li>;
}

@OopReactRender<TodoItem>({key: 'id'})   // a wrong field name is a type error
```

When the identity is built from several fields, do not write a function — write a `get`. That is the row's own
business anyway:

```tsx
class TodoItem {
  get key(): string {
    return `${this.board.id}-${this.title}`;
  }

  @OopReactRender({key: 'key'})
  row() {
    return <li>{this.title}</li>;
  }
}
```

The function form is left with one job: **a parent rendering rows for its children**, where the identity comes from
the call arguments and `this` has nothing to offer.

```tsx
@OopReactRender({key: (_self: TodoBoard, item: TodoItem) => item.id})
row(item: TodoItem) {
  return <li>{item.title}</li>;
}
```

The more thorough route is to let the child render itself (`item.row()` with `{key: 'id'}`) — then no function at
all.

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

`OopReactCallback` wraps a callback that renders an island when called — the render-prop shape. Written once, so a
loop needs no lambda per item:

```tsx
const renderRow = OopReactCallback((item: Item) => <li>{item.title}</li>, {
  key: (item: Item) => item.id,
});

function List({items}: {items: Item[]}) {
  return <ul>{items.map(renderRow)}</ul>;
}
```

**The key goes at the call site, not in the return value.** React compares keys among **siblings at the parent**,
and the content is only known once the render function has run — so the key belongs to the moment the island is
created: the decorator's options, or the second argument here. A `key` on the inner `<li>` does not help; what sits in
the parent's list is the island, not that `<li>`.

Both use hooks, so they must be called during a render — not from an event handler.

A render method itself may call hooks too (it is a component). For providers, `Form.useForm` and `App.useApp`, see
[complex components and hooks](./complex-components.md).
