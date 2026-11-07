---
id: api
title: API
slug: /api
sidebar_position: 3
---

所有导出都带 `OopReact` 前缀。包是纯 ESM，`react` / `react-dom` / `mobx` / `mobx-react-lite` 是 peer 依赖。

## 渲染

### `OopReactRender(options?)`

```ts
OopReactRender(options?: OopReactRenderOptions): MethodDecorator

interface OopReactRenderOptions {
  name?: string;                                          // 岛名前缀：<name>.<method>
  key?: (instance: any, ...args: any[]) => Key | null;    // 列表里的 key
}
```

标在一个返回 `ReactNode` 的方法上。方法保留原签名，调用它返回一个已订阅、已包边界的元素；元素可以在任何
渲染过程中创建（普通组件、别的岛、map）。

需要 `experimentalDecorators`。

## 组件桥

### `OopReactComponent(Class, method, options?)`

```ts
OopReactComponent<Props, Instance>(
  Class: new (props: Props) => Instance,
  method: OopReactRenderMethodKey<Instance>,
  options?: OopReactComponentOptions<Props, Instance>,
): ComponentType<Props>

interface OopReactComponentOptions<Props, Instance> {
  name?: string;                            // 组件与它的岛的名字前缀
  autoObservable?: boolean;                 // 默认 true：类没自己声明时由本工厂声明
  annotations?: OopReactAnnotations<Instance>;
  onPropsChange?: (instance: Instance, props: Props, previousProps: Props) => void;
}
```

把「类 + 一个渲染方法」挂成 React 组件。**这是桥，不是主路径** —— 主路径是普通组件返回 `obj.view()`，见
[与 React 衔接](./guide/react-bridge.md)。

## 函数式岛

### `OopReactObserver(render)`

```ts
OopReactObserver(render: () => ReactNode): ReactNode
```

在组件渲染中调用，订阅 `render` 读到的状态。内部使用 hooks。

### `OopReactCallback(render)`

```ts
OopReactCallback<Args, Result>(render: (...args: Args) => Result): (...args: Args) => Result
```

包成「调用即得到岛」的回调，用于 render prop。

## 桥

### `OopReactBridge`

```tsx
<OopReactBridge value={form} assign={(next) => editor.bindForm(next)} release={() => editor.releaseForm()} />
```

把只能在组件里拿到的实例（`Form.useForm()`、`App.useApp()`、`Modal.useModal()`）交给对象：它渲染 `null`，
在 commit 之后的 `useEffect` 里调用 `assign`，值变化时再调一次，卸载时调 `release`。
之后对象方法就能直接调表单/提示/弹窗的 API。见[复杂组件与 hooks](./guide/complex-components.md)。

## 状态

### `OopReactObservable(instance, annotations?, options?)`

```ts
OopReactObservable<T extends object>(
  instance: T,
  annotations?: {[K in keyof T]?: AnnotationMapEntry},
  options?: {autoBind?: boolean; deep?: boolean},
): T
```

在状态类的构造器里调用：字段变可观察、方法变 action 并绑定、getter 变 computed。用 `yield` 写的 generator
方法仍然会变成 MobX 的 `flow`（见[状态](./guide/state.md)），但普通异步请用 `async/await`。
`annotations` 的键就是真实字段名，写错是编译错误。

两个与 MobX `makeAutoObservable` 不同的地方：

- **走完整个原型链**，所以 `class Derived extends Base` 可用；父类构造器里调过一次后，子类再调只补新增的键。
- 幂等：同一个实例重复调用不会重复标注。

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

字段级黑名单：被标记的字段保持普通字段，不建 observable、不参与订阅，子类继承这个标记。
`OopReactObservable` 的 `annotations` 仍然可用，并且优先级高于标记。

### `OopReactAction()`

```ts
@OopReactAction()
reset(): void {
  this.customer = '';
  this.amount = 0;
  this.saving = false;   // 三次写入，一次渲染
}
```

把一个方法**显式**声明成事务：里面的写入打包成一次通知。多数类里这是冗余的（方法本来就是 action），
它用于 `autoBind: false`、注解表把方法排除掉、或者只是想把意图写清楚。

严格模式默认关着，`await` 之后可以直接写字段；要把连续几行写入合成一次通知，就抽成一个方法（方法本身是
action）或用 `runInAction`。`@OopReactAction()` 只作用于它标注的那个方法，管不到别的异步续行。

## 错误

### `OopReactErrorBoundary`

```tsx
<OopReactErrorBoundary name="Chart">{children}</OopReactErrorBoundary>
```

使用全局 `fallback` / `onError` 的边界。`@OopReactRender()` 已经给每个岛加了一层。

## 配置

### `OopReactConfigure(patch)`

```ts
OopReactConfigure(patch: Partial<OopReactConfig>): () => void

type OopReactEnforceActions = 'never' | 'observed' | 'always';

interface OopReactConfig {
  fallback: ComponentType<OopReactFallbackProps>;
  onError(error: unknown, name?: string): void;
  /** 默认 `'never'`：库加载时就关掉 MobX 严格模式。 */
  enforceActions: OopReactEnforceActions;
}

interface OopReactFallbackProps {
  error: unknown;
  name?: string;
  reset: () => void;
}
```

返回恢复函数。`enforceActions` 默认 `'never'` —— 库加载时自动关掉 MobX 严格模式，因为「字段直接写」是这套模型
的基础；要把它打开就 `OopReactConfigure({enforceActions: 'always'})`，见[状态](./guide/state.md)。
响应式实现不可替换，原因见[全局配置](./guide/configure.md)。

## 类型

| 类型 | 用途 |
| --- | --- |
| `OopReactRenderFunction` | `(...args: any[]) => ReactNode`，渲染方法的形状 |
| `OopReactRenderOptions` | 装饰器选项（`name` / `key`） |
| `OopReactRenderMethodKey<Instance>` | `Instance` 上所有返回 `ReactNode` 的方法名 |
| `OopReactComponentOptions` | 组件桥选项 |
| `OopReactAnnotations<T>` | 字段名 → MobX 注解，键受 `keyof T` 约束 |
| `OopReactObservableOptions` | `autoBind` / `deep` |
| `OopReactConfig` | 全局配置（`fallback` / `onError`） |
| `OopReactFallbackProps` | fallback 组件收到的 props |
| `OopReactErrorBoundaryProps` | 边界组件的 props |
