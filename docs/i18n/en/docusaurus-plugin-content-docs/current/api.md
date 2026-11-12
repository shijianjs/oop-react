---
id: api
title: API
slug: /api
sidebar_position: 3
---

Every export carries the `OopReact` prefix. The package is pure ESM; `react`, `react-dom`, `mobx` and
`mobx-react-lite` are peer dependencies.

## Rendering

### `OopReactRender(options?)`

```ts
OopReactRender<Instance = any>(options?: OopReactRenderOptions<Instance>): MethodDecorator

interface OopReactRenderOptions<Instance = any> {
  name?: string;                                                          // island name prefix: <name>.<method>
  key?: keyof Instance | ((instance: Instance, ...args: any[]) => Key);    // the key of a list entry
}
```

Marks a method that returns `ReactNode`. The method keeps its signature; calling it returns an element that is
already subscribed and wrapped in a boundary. Creating that element is side-effect free, so it can happen during any
render — a plain component, another island, a `map`.

`key` is the identity of the entry, and almost always **one field of the object itself**:

```tsx
@OopReactRender({key: 'id'})            // this.id
row() { … }

@OopReactRender<Row>({key: 'id'})       // the same, with the field name checked
row() { … }
```

To build an identity from several fields, write a `get` on the class and pass its name (see
[render methods](./guide/render-methods.md)). The function form has one use left: a parent rendering rows for its
children, where the identity comes from the call arguments.

Requires `experimentalDecorators`.

## Component bridge

### `OopReactComponent(Class, method, options?)`

```ts
OopReactComponent<Props, Instance>(
  Class: new (props: Props) => Instance,
  method: OopReactRenderMethodKey<Instance>,
  options?: OopReactComponentOptions<Props, Instance>,
): ComponentType<Props>

interface OopReactComponentOptions<Props, Instance> {
  name?: string;                            // name prefix for the component and its islands
  autoObservable?: boolean;                 // default true: this factory declares the state if the class did not
  annotations?: OopReactAnnotations<Instance>;
  onPropsChange?: (instance: Instance, props: Props, previousProps: Props) => void;
}
```

Mounts "class + one render method" as a React component. **This is the bridge, not the main path** — the main path is
a plain component returning `obj.view()`; see [the React bridge](./guide/react-bridge.md).

## Function islands

### `OopReactObserver(render)`

```ts
OopReactObserver(render: () => ReactNode): ReactNode
```

Called during a render, subscribes to the state `render` reads. Uses hooks internally.

### `OopReactCallback(render)`

```ts
OopReactCallback<Args, Result>(render: (...args: Args) => Result): (...args: Args) => Result
```

Wraps a function into a callback that renders an island when called — the render-prop shape.

## Bridge

### `OopReactBridge`

```tsx
<OopReactBridge value={form} assign={(next) => editor.bindForm(next)} release={() => editor.releaseForm()} />
```

Hands an instance that only exists inside a component (`Form.useForm()`, `App.useApp()`, `Modal.useModal()`) to an
object: it renders `null`, calls `assign` in a `useEffect` after commit, again when the value changes, and `release`
on unmount. From then on object methods can call the form, the message api or the dialog directly. See
[complex components and hooks](./guide/complex-components.md).

## State

### `OopReactObservable(instance, annotations?, options?)`

```ts
OopReactObservable<T extends object>(
  instance: T,
  annotations?: {[K in keyof T]?: AnnotationMapEntry},
  options?: {autoBind?: boolean; deep?: boolean},
): T
```

Called in a state class's constructor: fields become observable, methods become actions bound to the instance, getters
computeds. A generator method written with `yield` is still marked as a MobX `flow` (see [state](./guide/state.md)),
but ordinary async code should use `async/await`. The keys of `annotations` are the real field names, so a typo is a
compile error.

Two differences from MobX's `makeAutoObservable`:

- **the whole prototype chain is annotated**, so `class Derived extends Base` works; after the base constructor has
  called it, a subclass call only adds the keys that appeared since;
- idempotent: calling it twice on one instance does not re-annotate anything.

```ts
constructor() {
  OopReactObservable(this);
}
```

### `OopReactIgnore`

```ts
class Cart {
  @OopReactIgnore readonly api = new ApiClient();
  items: Item[] = [];
}
```

A field-level denylist: a marked field stays a plain field (no observable, no subscription), and subclasses inherit
the mark. `OopReactObservable`'s `annotations` still work and take precedence over it.

### `OopReactAction()`

```ts
@OopReactAction()
reset(): void {
  this.customer = '';
  this.amount = 0;
  this.saving = false;   // three writes, one render
}
```

Explicitly declares a method as one transaction: its writes are batched into a single notification. In most classes
this is redundant (methods are actions already); it is there for `autoBind: false`, an annotation map that opts the
method out, or simply to spell out the intent.

Strict mode is off by default, so writing fields after an `await` just works; to batch several consecutive writes,
extract them into a method (a method is an action) or use `runInAction`. `@OopReactAction()` only covers the method it
annotates, not the continuations of an `async` one.

## Async

### `OopReactLoading`

```ts
class OopReactLoading {
  readonly loading: boolean;
  run<T>(task: () => Promise<T>, options?: OopReactTaskOptions): Promise<OopReactTaskResult<T>>;
}

interface OopReactTaskOptions {
  timeoutMs?: number;
}

type OopReactTaskResult<T> =
  | {ok: true; value: T}
  | {ok: false; error: unknown; timedOut: boolean};

class OopReactTimeoutError extends Error {
  readonly timeoutMs: number;
}
```

The state of one async operation: **one per object** (usually one per button, per submit), unrelated to each other.
`run` raises `loading` before the task, always lowers it afterwards, and turns errors and timeouts into a return
value instead of throwing.

```ts
class SaveButton {
  readonly loading = new OopReactLoading();

  async click(): Promise<void> {
    const result = await this.loading.run(() => api.save(), {timeoutMs: 5000});
    if (!result.ok) this.page.feedback.error(result.timedOut ? 'Timed out' : String(result.error));
  }

  @OopReactRender()
  view() {
    return <Button loading={this.loading.loading} onClick={() => void this.click()}>Save</Button>;
  }
}
```

It **does not toast, log, draw a progress bar or retry** — that is the job of the object holding it. `timeoutMs`
only makes `run` return early; the task itself keeps running (pass an `AbortSignal` into `fetch` to really cancel
it). Overlapping `run` calls on the same object are counted, so the one that finishes first does not clear
`loading` while another is still going.

### `OopReactResource<T>`

```ts
class OopReactResource<T> {
  readonly loading: OopReactLoading;
  data: T | null;
  error: unknown;
  load(fetcher: () => Promise<T>, options?: OopReactTaskOptions): Promise<OopReactTaskResult<T>>;
  invalidate(): void;
}
```

One piece of remote data: `data` / `loading` / `error`, plus the `load` that fetches it. On failure the previous
`data` stays and `error` is recorded; `invalidate()` clears both. No caching, no deduping, no
stale-while-revalidate — to fetch again, call `load` again with the same fetcher.

## Lifecycle

### `OopReactCleanup`

```ts
class OopReactCleanup {
  add(disposer: () => void): () => void;   // returns "unregister"
  dispose(): void;                          // runs them all and empties; safe to call twice
  readonly size: number;
  readonly disposed: boolean;
}
```

The clean-up work one object accumulates: `reaction`s, timers, DOM listeners, third-party instances. One disposer
throwing does not stop the rest; adding a disposer after `dispose()` runs it immediately.

## Selection

### `OopReactSelection<K = string>`

```ts
class OopReactSelection<K = string> {
  ids: K[];
  readonly size: number;
  readonly empty: boolean;
  has(id: K): boolean;
  add(id: K): void;
  remove(id: K): void;
  toggle(id: K): void;
  set(ids: readonly K[]): void;       // a table's onChange hands its keys straight in
  clear(): void;
  isAll(total: number): boolean;      // total > 0 and everything selected
  isPartial(total: number): boolean;  // some selected, not all
}
```

It stores "which ids are selected" and nothing about the rows: a row asks `selection.has(row.id)`.

## Errors

### `OopReactErrorBoundary`

```tsx
<OopReactErrorBoundary name="Chart">{children}</OopReactErrorBoundary>
```

A boundary using the global `fallback` / `onError`. `@OopReactRender()` already adds one per island.

## Configuration

### `OopReactConfigure(patch)`

```ts
OopReactConfigure(patch: Partial<OopReactConfig>): () => void

type OopReactEnforceActions = 'never' | 'observed' | 'always';

interface OopReactConfig {
  fallback: ComponentType<OopReactFallbackProps>;
  onError(error: unknown, name?: string): void;
  /** Defaults to `'never'`: the library switches MobX strict mode off as it loads. */
  enforceActions: OopReactEnforceActions;
}

interface OopReactFallbackProps {
  error: unknown;
  name?: string;
  reset: () => void;
}
```

Returns a restore function. `enforceActions` defaults to `'never'`: the library switches MobX strict mode off as it
loads, because writing fields directly is the basis of this model. Turn it on with
`OopReactConfigure({enforceActions: 'always'})`, see [state](./guide/state.md). The reactive engine is not
configurable on purpose — see [global configuration](./guide/configure.md).

## Types

| Type | Purpose |
| --- | --- |
| `OopReactRenderFunction` | `(...args: any[]) => ReactNode`, the shape of a render method |
| `OopReactRenderOptions` | decorator options (`name` / `key`) |
| `OopReactRenderMethodKey<Instance>` | every method on `Instance` that returns `ReactNode` |
| `OopReactComponentOptions` | component bridge options |
| `OopReactAnnotations<T>` | field name → MobX annotation, keys constrained by `keyof T` |
| `OopReactObservableOptions` | `autoBind` / `deep` |
| `OopReactConfig` | global configuration (`fallback` / `onError`) |
| `OopReactFallbackProps` | props a fallback component receives |
| `OopReactErrorBoundaryProps` | props of the boundary component |
| `OopReactTaskOptions` | options for `run` (`timeoutMs`) |
| `OopReactTaskResult<T>` | what `run` resolves to: success / failure / timed out |
