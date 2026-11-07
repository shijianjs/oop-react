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
OopReactRender(options?: OopReactRenderOptions): MethodDecorator

interface OopReactRenderOptions {
  name?: string;                                          // island name prefix: <name>.<method>
  key?: (instance: any, ...args: any[]) => Key | null;    // the key of a list entry
}
```

Marks a method that returns `ReactNode`. The method keeps its signature; calling it returns an element that is
already subscribed and wrapped in a boundary. Creating that element is side-effect free, so it can happen during any
render — a plain component, another island, a `map`.

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

Called in a state class's constructor: fields become observable, methods actions bound to the instance, getters
computeds, generators flows. The keys of `annotations` are the real field names, so a typo is a compile error.

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

It cannot keep an `async` method inside an action past its first `await` — that needs a `flow` (generator method) or
`runInAction`.

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
