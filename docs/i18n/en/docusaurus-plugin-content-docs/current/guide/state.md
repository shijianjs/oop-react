---
id: state
title: State
slug: /guide/state
---

State is a field on the instance, and the class declares its own observability in its constructor.

## Declaring it in the constructor

```tsx title="cart.ts"
import {OopReactObservable} from 'oop-react';

export class Cart {
  readonly api = new ApiClient();
  items: Item[] = [];
  saving = false;

  constructor() {
    OopReactObservable(this, {api: false});
  }
}
```

- every field becomes observable, every method an action bound to the instance;
- the second argument excludes what is *not* state: services, DOM nodes, caches, and other state objects that
  already declared their own observability;
- its type is `{[K in keyof Cart]?: Annotation}` — a wrong field name is a **compile error**, and a rename you forgot
  to follow is caught by the compiler. That typing (plus idempotence) is all the package adds to
  `makeAutoObservable(this, {...})`; everything else is MobX as-is.

:::caution Call it last in the constructor
`makeAutoObservable` only sees the fields that exist when it runs. Assign every field — at its declaration or earlier
in the constructor — before calling it.
:::

## Change state in methods

```ts
export class Cart {
  items: Item[] = [];

  add(item: Item): void {
    this.items.push(item);
  }

  async checkout(): Promise<void> {
    this.saving = true;
    try {
      await this.api.pay(this.items);
    } finally {
      this.saving = false;
    }
  }
}
```

Methods become actions, so `onClick={this.add}` raises no `enforceActions` warning.

:::caution Do not mutate fields inline in JSX
```tsx
<button onClick={() => (this.saving = true)}>Save</button>
```
That bypasses the action and earns a MobX warning in development. It is also the wrong shape: the entry point for a
state change is a method.
:::

## Derived values are getters

```ts
export class Todos {
  items: {title: string; done: boolean}[] = [];

  get visible() {
    return this.items.filter((item) => !item.done);
  }
}
```

A getter is a computed: recalculated only when its inputs change, and an island reading it does not re-render
because of unrelated fields.

## Nested state objects

When a parent holds another state object, mark it `false`: that object declares its own observability, and
observing it twice from above means nothing.

```ts
export class Workshop {
  readonly todos: TodoBoard;
  selected: TodoItem | null = null;

  constructor() {
    this.todos = new TodoBoard(this);
    // todos manages itself; selected is this object's state, so it stays observed
    OopReactObservable(this, {todos: false});
  }
}
```

`selected` is *not* annotated: it really does have to trigger a re-render. Annotations change observability, not the
meaning of the field.

## The rest of MobX, directly

The package does not wrap these; import them from `mobx`:

```ts
import {autorun, flow, reaction, toJS} from 'mobx';
```

- `flow` / `flowResult`: asynchronous actions, good for multi-step forms;
- `reaction` / `autorun`: side effects (local storage, analytics, sync to the URL);
- `toJS`: turn state into a plain object before sending or persisting it;
- the `computed` / `observable` / `action` decorators: finer control, and they coexist with `@OopReactRender()`.

## Options

```ts
OopReactObservable(this, {api: false}, {autoBind: false, deep: false});
```

| Option | Default | Meaning |
| --- | --- | --- |
| `autoBind` | `true` | methods are bound, so `this.onClick` is a stable reference |
| `deep` | `true` | nested objects/arrays are observed too; with `false`, only reassignment triggers |

With `autoBind: false`, `onClick={this.save}` loses `this`; write `onClick={() => this.save()}`.
