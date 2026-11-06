---
id: state
title: State
slug: /guide/state
---

State is a field on the instance. There is no extra `state()`, `useState()` or store factory.

## Fields

```tsx
class Form {
  name = '';
  tags: string[] = [];
  saving = false;
}
```

When `OopReactComponent` creates the instance it makes the fields subscribable: a render method that reads one
subscribes to it, and writing it re-renders those methods. Nested objects and arrays are covered too —
`this.tags.push('x')` triggers an update.

## Change state in methods

```tsx
class Form {
  name = '';
  saving = false;

  setName(value: string): void {
    this.name = value;
  }

  async save(): Promise<void> {
    this.saving = true;
    try {
      await fetch('/api/save', {method: 'POST', body: this.name});
    } finally {
      this.saving = false;
    }
  }
}
```

`makeAutoObservable` turns methods into actions, so `onClick={this.save}` raises no warnings.

:::caution Do not mutate fields inline in JSX
```tsx
<button onClick={() => (this.saving = true)}>Save</button>
```
In development that earns a MobX `enforceActions` warning: it bypasses the action. It still works, but the
intended shape is to call a method — **the entry point for changing state is a method**, not an arrow function
scattered through JSX.
:::

## Derived values are getters

```tsx
class Todos {
  items: {title: string; done: boolean}[] = [];
  filter: 'all' | 'done' = 'all';

  get visible() {
    return this.filter === 'all' ? this.items : this.items.filter((item) => item.done);
  }

  get remaining() {
    return this.items.filter((item) => !item.done).length;
  }
}
```

A getter is a computed: it is recalculated only when `items` or `filter` changes, and a render method that reads it
does not re-render because of unrelated fields.

## Fields that are not state

Services, DOM references and caches should not be subscribed. The default adapter would make them observable too,
which makes call chains look suspicious (watching a method on a service means nothing). Exclude them with
`observableOptions.annotations`:

```tsx
const api = new ApiClient();

class Page {
  data: Row[] = [];
  readonly client = api;

  @OopReactRender()
  view() {
    return <Table rows={this.data} onReload={this.reload} />;
  }

  reload(): void {
    void this.client.fetchRows().then((rows) => {
      this.data = rows;
    });
  }
}

export const PageView = OopReactComponent(Page, 'view', {
  observableOptions: {annotations: {client: false}},
});
```

`client` is still readable and callable; assignments to it and changes inside it are just no longer tracked.

## Shared instances

`OopReactComponent` creates a fresh instance per mount. To share one object between several components (a store
used by many, a child object owned by a parent), construct it yourself, call `OopReactObservable` once, and use the
component with `autoObservable: false`:

```tsx
class Cart {
  items: string[] = [];

  add(item: string): void {
    this.items.push(item);
  }
}

export const cart = OopReactObservable(new Cart());

class CartBadge {
  @OopReactRender()
  view() {
    return <span>{cart.items.length}</span>;
  }
}

export const CartBadgeView = OopReactComponent(CartBadge, 'view', {autoObservable: false});
```

Calling `OopReactObservable` on the same object repeatedly has no side effects. It does not wrap or copy the
instance — the object you hold is the observed object, so `===` comparisons keep working.

## Objects call each other

```tsx
class ListPanel {
  constructor(readonly detail: DetailPanel) {}

  select(id: string): void {
    this.detail.load(id); // a direct call: no prop, no context
  }
}

class DetailPanel {
  id = '';

  load(id: string): void {
    this.id = id;
  }

  @OopReactRender()
  view() {
    return <div>{this.id}</div>;
  }
}
```

Who holds whom is a business decision, and updates travel along method calls. That is what "UI organisation does
not leak into code organisation" means: `ListPanel` does not need to know how `DetailPanel` renders, nor does it
need to lift its state into a common parent.
