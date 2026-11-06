---
id: api
title: API
slug: /api
sidebar_position: 3
---

所有导出都带 `OopReact` 前缀。包是纯 ESM，`react` / `react-dom` 是 peer 依赖。

## 装饰器

### `OopReactRender()`

```ts
OopReactRender(): MethodDecorator
```

标在一个返回 `ReactNode` 的方法上。方法保留原签名，调用它返回一个已订阅、已包边界的元素。

```tsx
class Counter {
  @OopReactRender()
  view() {
    return <p>{this.count}</p>;
  }
}
```

需要 `experimentalDecorators`。方法必须返回值类型可赋给 `ReactNode`，否则 `OopReactComponent` 的
`OopReactRenderMethodKey` 不会把它算作可选方法。

## 组件工厂

### `OopReactComponent(Class, method, options?)`

```ts
OopReactComponent<Props, Instance>(
  Class: new (props: Props) => Instance,
  method: OopReactRenderMethodKey<Instance>,
  options?: OopReactComponentOptions<Props, Instance>,
): ComponentType<Props>
```

创建实例一次、让它可观察、渲染 `method`。返回普通函数组件。

```ts
interface OopReactComponentOptions<Props, Instance> {
  name?: string;                       // 组件与它的岛的名字：<name>.<method>
  autoObservable?: boolean;            // false = 实例自己负责可观察性
  observableOptions?: OopReactObservableOptions;
  onPropsChange?: (instance: Instance, props: Props, previousProps: Props) => void;
}
```

## 函数式入口

### `OopReactObserver(render)`

```ts
OopReactObserver(render: () => ReactNode): ReactNode
```

在组件渲染中调用，订阅 `render` 读到的状态。必须处于渲染过程中（内部使用 hooks）。

### `OopReactCallback(render)`

```ts
OopReactCallback<Args, Result>(render: (...args: Args) => Result): (...args: Args) => Result
```

把函数包成「调用即得到岛」的回调，用于 render prop。

## 错误

### `OopReactErrorBoundary`

```tsx
<OopReactErrorBoundary name="Chart">{children}</OopReactErrorBoundary>
```

使用全局 `fallback` / `onError` 配置的边界。`@OopReactRender()` 已经为每个岛自动加了一层，只在需要保护
某段手写 JSX 时直接用它。

## 状态

### `OopReactObservable(instance, options?)`

```ts
OopReactObservable<T extends object>(instance: T, options?: OopReactObservableOptions): T
```

就地让对象可观察，重复调用无副作用。用于在组件之外创建、被多处共用的实例。

```ts
interface OopReactObservableOptions {
  annotations?: Record<string, unknown>;  // 字段名 → false 表示「不是状态」
  autoBind?: boolean;                     // 默认 true
  deep?: boolean;                         // 默认 true，嵌套对象/数组也观察
}
```

## 配置

### `OopReactConfigure(patch)`

```ts
OopReactConfigure(patch: Partial<OopReactConfig>): () => void
```

替换默认实现，返回恢复函数。

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

## 类型

| 类型 | 用途 |
| --- | --- |
| `OopReactRenderFunction` | `(...args: any[]) => ReactNode`，渲染方法的形状 |
| `OopReactRenderMethodKey<Instance>` | 实例上所有返回 `ReactNode` 的方法名 |
| `OopReactComponentOptions` | 组件工厂选项 |
| `OopReactObservableOptions` | 可观察性选项 |
| `OopReactConfig` | 全局配置 |
| `OopReactFallbackProps` | fallback 组件收到的 props |
| `OopReactErrorBoundaryProps` | 边界组件的 props |
