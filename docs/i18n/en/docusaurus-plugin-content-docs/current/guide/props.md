---
id: props
title: Props and lifecycle
slug: /guide/props
---

`props` does one thing in this library: **it seeds the constructor**.

```tsx
class Greeting {
  name: string;

  constructor(props: {name: string}) {
    this.name = props.name;
  }

  @OopReactRender()
  view() {
    return <p>Hello, {this.name}</p>;
  }
}

export const GreetingView = OopReactComponent(Greeting, 'view');
```

```tsx
<GreetingView name="world" />
```

The type is inferred from the constructor: `Props` in `new (props: Props) => Instance` is the component's prop type.

## The instance is created once

On mount the component runs `new Class(props)` and **never rebuilds it**. Parent re-renders and prop changes all
keep the same instance:

- constructor side effects happen once;
- instance fields are not reset;
- method references stay stable, so they are safe to pass as `onClick`.

That is the difference from `useState`: here, "re-render" does not mean "start over".

## When props change

Use `onPropsChange` to react to later prop changes. It runs after mount and after every props change:

```tsx
class Editor {
  title = '';

  sync(props: {title: string}): void {
    this.title = props.title;
  }

  @OopReactRender()
  view() {
    return <h2>{this.title}</h2>;
  }
}

export const EditorView = OopReactComponent(Editor, 'view', {
  onPropsChange: (instance, props: {title: string}) => instance.sync(props),
});
```

It receives `(instance, props, previousProps)`. Note that it is a **method call**: the state change has to happen
in a class method (which becomes an action), not by assigning a field from the callback.

## When not to use props

`props` is React's channel for passing values down a tree, and here objects can hold each other instead:

```tsx
class Detail {
  constructor(readonly list: List) {}
}

class List {
  readonly detail = new Detail(this);
  readonly rows: Row[] = [];
}
```

The two objects call each other; nothing needs lifting into a common parent, and no context, callback prop or event
bus is required. Reach for props when the component is meant to be used by an unrelated parent — a clear boundary
is a feature: **props at the library boundary, holding inside business code**.
