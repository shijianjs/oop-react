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

## Excluding fields with `@OopReactIgnore`

The annotation map says "everything except these", which turns into a list to maintain once a class has a few of
them. Marking the field where it is declared reads better:

```ts
class Cart {
  @OopReactIgnore readonly api = new ApiClient();
  @OopReactIgnore readonly board: Board;
  items: Item[] = [];

  constructor() {
    OopReactObservable(this);
  }
}
```

- a marked field stays a plain field: no observable, no subscription — and subclasses inherit the mark;
- the annotation map still works for one-off cases and **wins** over the mark:
  `OopReactObservable(this, {items: false})`.

## Inheritance: base classes are annotated too

`makeAutoObservable` throws on a class that has a superclass (`can only be used for classes that don't have a
superclass`), and it only looks at the immediate prototype. `OopReactObservable` walks the **whole chain**, and a
subclass may call it again:

```ts
class Base {
  @OopReactIgnore readonly service = new ApiClient();
  count = 0;

  constructor() {
    OopReactObservable(this);
  }

  get doubled() {
    return this.count * 2;      // computed
  }

  bump(): void {
    this.count += 1;            // action.bound
  }
}

class Derived extends Base {
  extra = 0;

  constructor() {
    super();
    OopReactObservable(this);   // only adds `extra`; base keys are not re-annotated
  }
}
```

Base getters become computeds, base methods become actions, and a base `@OopReactIgnore` still applies.

## Strict mode is off by default

The first thing `oop-react` does when it loads is set MobX's `enforceActions` to `'never'`:

```ts
// done by the library entry, nothing to write
configure({enforceActions: 'never'});
```

The reason is that this model writes state exactly like this: a field is state, and changing it is
`this.count += 1`. MobX's default strict mode prints a `console.warn` for every write that happens outside an action:

```
[MobX] Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed.
```

Under this model those warnings are pure noise, so they are off by default.

**What you lose is the police, not the transaction.** Methods being actions is unrelated to this flag:

```ts
class Batch {
  a = 0;
  b = 0;

  both(): void {
    this.a += 1;
    this.b += 1;   // two writes, one notification to observers
  }
}
```

Turn it back on when a team wants "every modification must be explicit":

```ts
OopReactConfigure({enforceActions: 'always'});   // or 'observed'
```

Note that in MobX 7 a violation is a `console.warn`, not an exception — with strict mode on the symptom is a flooded
console, not a crash.

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

Methods become actions: writing several fields in one call notifies observers once, just like one `runInAction` block.
To make a method **explicitly** a transaction (for example when a class turned automatic annotations off), mark it:

```ts
@OopReactAction()
reset(): void {
  this.customer = '';
  this.amount = 0;
  this.saving = false;   // three writes, one render
}
```

:::caution Do not mutate fields inline in JSX
```tsx
<button onClick={() => (this.saving = true)}>Save</button>
```
With strict mode off this line no longer warns, but it is still wrong: each write is its own notification (three lines
mean three re-renders), and the entry point for a state change leaks into JSX. To group a block, open a transaction
yourself:

```ts
runInAction(() => {
  this.saving = true;
  this.draft = null;
});
```
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

Write `flow` as a **field**, not as a generator method:

```ts
export class Cart {
  readonly save = flow(function* (this: Cart, draft: Draft) {
    yield api.persist(draft);
    this.items = yield api.list();
  });
}
```

`makeAutoObservable` does turn a generator method (`*save()`) into a flow, but TypeScript still types it as a
`Generator`, so every caller needs an `as unknown as Promise` cast. As a field its type is the function it becomes at
runtime: `(draft) => CancellablePromise<void>`.

**`flow` is optional.** Strict mode is off by default, so `async/await` in an object method works fine: writing a
field after `await` raises no warning, it just notifies observers once per write.

What `flow` buys you is "**every step of a multi-step sequence is its own action**":

- `loading = true` → request → write the result → clean up: the code after each `yield` runs inside an action, so
  intermediate state lands in one notification;
- it returns a `CancellablePromise`, so the work can be cancelled when a page goes away;
- if a host application turns strict mode back on, writes after an `await` warn one by one
  (`Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed`),
  while `flow` is unaffected — the reason it is the safer choice for "strict mode + multi-step async".

In short: **one `await` and one write → `async` is shorter; several steps, each writing state → `flow`.**

## Options

```ts
OopReactObservable(this, {api: false}, {autoBind: false, deep: false});
```

| Option | Default | Meaning |
| --- | --- | --- |
| `autoBind` | `true` | methods are bound, so `this.onClick` is a stable reference |
| `deep` | `true` | nested objects/arrays are observed too; with `false`, only reassignment triggers |

With `autoBind: false`, `onClick={this.save}` loses `this`; write `onClick={() => this.save()}`.
