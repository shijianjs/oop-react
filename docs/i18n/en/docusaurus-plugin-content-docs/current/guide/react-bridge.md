---
id: react-bridge
title: The React bridge
slug: /guide/react-bridge
---

The main path is one line: a plain React component returning an island.

```tsx
export function CartView() {
  return cart.view();
}
```

This page is about the few things that happen at that boundary.

## What the main path means

- When the component re-runs because a parent re-rendered, `cart.view()` returns a fresh island element and the
  island runs once — like any child component. The island's independence shows up **when state changes**: a change
  to `cart.count` re-runs only the island that reads it, not its siblings.
- The component may still have hooks of its own (route params, an antd form instance), but they should not become
  the home of business state.

## When it has to be a real component: `OopReactComponent`

```tsx
import {OopReactComponent} from 'oop-react';

export const CounterView = OopReactComponent(Counter, 'view');
```

It does three things: `new Counter(props)` once, makes the instance observable (a no-op when the class already
declared its own), and renders `view`. Reach for it when:

- **adopting incrementally** — this screen is the new object graph, the rest of the page is still React;
- **a component contract is required** — a route, antd's `Modal`/`Tabs`, somebody else's `<YourComponent />`;
- **props are the entry point** — the caller is unknown code with no other channel.

### props and the constructor

```tsx
class Editor {
  title: string;
  readonly store: ArticleStore;

  constructor(props: {title: string; store: ArticleStore}) {
    this.title = props.title;
    this.store = props.store;
    OopReactObservable(this, {store: false});
  }

  @OopReactRender()
  view() {
    return <h2>{this.title}</h2>;
  }
}

export const EditorView = OopReactComponent(Editor, 'view');
```

The instance is **created once**: parent re-renders and prop changes never rebuild it. Constructor side effects
happen once, fields are not reset, method references stay stable.

### When props change

```tsx
export const EditorView = OopReactComponent(Editor, 'view', {
  onPropsChange: (instance, props) => instance.syncTitle(props.title),
});
```

Called after mount and after every props change. Note that it is a **method call**: the state change belongs in the
class's action.

### Options

| Option | Purpose |
| --- | --- |
| `name` | name prefix for the component and its islands (DevTools, fallback, `onError`) |
| `autoObservable` | default `true`; irrelevant when the class declares its own observability |
| `annotations` | field overrides for the observability this factory declares (typed with `Instance`) |
| `onPropsChange` | sync hook after props change |

## Which one to use

| Situation | Use |
| --- | --- |
| your own pages, internal objects | a plain component returning `obj.view()` |
| one object that has to sit in somebody else's React tree | `OopReactComponent` |
| a single piece of JSX that needs subscribing | `OopReactObserver(render)` |
| a render prop / a callback returning JSX | `OopReactCallback(render)` |

One sentence: **`OopReactComponent` is a bridge, not a foundation.** If the whole application is a pile of
`OopReactComponent(...)` calls you are back to "one class per component", and the object graph bought you nothing.
