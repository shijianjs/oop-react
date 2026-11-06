---
id: api
title: API
slug: /api
sidebar_position: 3
---

Every export carries the `OopReact` prefix. The package is pure ESM; `react` and `react-dom` are peer
dependencies.

## Decorator

### `OopReactRender()`

```ts
OopReactRender(): MethodDecorator
```

Marks a method that returns `ReactNode`. The method keeps its signature; calling it returns an element that is
already subscribed and already wrapped in a boundary.

```tsx
class Counter {
  @OopReactRender()
  view() {
    return <p>{this.count}</p>;
  }
}
```

Requires `experimentalDecorators`. The method's return type must be assignable to `ReactNode`, otherwise
`OopReactRenderMethodKey` will not offer it as a candidate to `OopReactComponent`.

## Component factory

### `OopReactComponent(Class, method, options?)`

```ts
OopReactComponent<Props, Instance>(
  Class: new (props: Props) => Instance,
  method: OopReactRenderMethodKey<Instance>,
  options?: OopReactComponentOptions<Props, Instance>,
): ComponentType<Props>
```

Creates the instance once, makes it observable, and renders `method`. Returns a plain function component.

```ts
interface OopReactComponentOptions<Props, Instance> {
  name?: string;                       // component and island name: <name>.<method>
  autoObservable?: boolean;            // false = the instance manages its own observability
  observableOptions?: OopReactObservableOptions;
  onPropsChange?: (instance: Instance, props: Props, previousProps: Props) => void;
}
```

## Function-based entry points

### `OopReactObserver(render)`

```ts
OopReactObserver(render: () => ReactNode): ReactNode
```

Called during a render, subscribes to the state `render` reads. It has to be called while rendering (it uses
hooks internally).

### `OopReactCallback(render)`

```ts
OopReactCallback<Args, Result>(render: (...args: Args) => Result): (...args: Args) => Result
```

Turns a function into a callback that renders an island when called — the render-prop shape.

## Errors

### `OopReactErrorBoundary`

```tsx
<OopReactErrorBoundary name="Chart">{children}</OopReactErrorBoundary>
```

A boundary that uses the global `fallback` / `onError` configuration. `@OopReactRender()` already adds one per
island; use this directly when a hand-written piece of JSX needs protecting.

## State

### `OopReactObservable(instance, options?)`

```ts
OopReactObservable<T extends object>(instance: T, options?: OopReactObservableOptions): T
```

Makes an object observable in place; calling it twice is a no-op. Use it for instances created outside a
component and shared by several.

```ts
interface OopReactObservableOptions {
  annotations?: Record<string, unknown>;  // field name → false means "not state"
  autoBind?: boolean;                     // default true
  deep?: boolean;                         // default true: nested objects/arrays are tracked too
}
```

## Configuration

### `OopReactConfigure(patch)`

```ts
OopReactConfigure(patch: Partial<OopReactConfig>): () => void
```

Replaces defaults and returns a function that restores them.

```ts
interface OopReactConfig {
  observe(render: () => ReactNode): ReactNode;
  observable<T extends object>(instance: T, options?: OopReactObservableOptions): T;
  fallback: ComponentType<OopReactFallbackProps>;
  onError(error: unknown, name?: string): void;
}

interface OopReactFallbackProps {
  error: unknown;
  name?: string;
  reset: () => void;
}
```

## Types

| Type | Purpose |
| --- | --- |
| `OopReactRenderFunction` | `(...args: any[]) => ReactNode`, the shape of a render method |
| `OopReactRenderMethodKey<Instance>` | every method on `Instance` that returns `ReactNode` |
| `OopReactComponentOptions` | component factory options |
| `OopReactObservableOptions` | observability options |
| `OopReactConfig` | global configuration |
| `OopReactFallbackProps` | props a fallback component receives |
| `OopReactErrorBoundaryProps` | props of the boundary component |
