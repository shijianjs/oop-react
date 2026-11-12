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
OopReactRender<Instance = any, Args extends unknown[] = any[]>(
  options?: OopReactRenderOptions<Instance, Args>,
): MethodDecorator

interface OopReactRenderOptions<Instance = any, Args extends unknown[] = any[]> {
  name?: string;                    // 岛名前缀：<name>.<method>
  key?:
    | keyof Instance                // 列表里的 key：自己身上的字段
    | keyof Args[number]            // …或者第一个参数上的字段（父对象代子对象渲染时）
    | ((instance: Instance, ...args: Args) => Key);
}
```

标在一个返回 `ReactNode` 的方法上。方法保留原签名，调用它返回一个已订阅、已包边界的元素；元素可以在任何
渲染过程中创建（普通组件、别的岛、map）。

`key` 就是这一项的身份，绝大多数情况是**自己身上一个字段**：

```tsx
@OopReactRender({key: 'id'})            // 取 this.id
row() { … }

@OopReactRender<Row>({key: 'id'})       // 同上，字段名会被检查
row() { … }
```

字段名先看**第一个参数**（方法有参数时 —— 那是父对象代子对象渲染），找不到再看自己。

身份要从几个字段凑出来，就在类里写个 `get`，再把字段名给它（见[渲染方法](./guide/render-methods.md)）。
函数形式只留给「算出来的 key」：不是某个字段，而是一段拼装。

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

### `OopReactObserver(render, options?)`

```ts
OopReactObserver(render: () => ReactNode, options?: OopReactObserverOptions): ReactNode

interface OopReactObserverOptions {
  key?: Key;      // 它在列表里的身份，同 @OopReactRender({key})
}
```

在组件渲染中调用，订阅 `render` 读到的状态。内部使用 hooks。

### `OopReactCallback(render, options?)`

```ts
OopReactCallback<Args, Result>(
  render: (...args: Args) => Result,
  options?: OopReactCallbackOptions<Args>,
): (...args: Args) => Result

interface OopReactCallbackOptions<Args extends unknown[]> {
  key?: (...args: Args) => Key | null;    // 从调用参数算这个岛的身份
}
```

包成「调用即得到岛」的回调，用于 render prop。key 在**外层**：坐在父级列表里的是这个岛，写在它里面的
`<li key>` 帮不上忙。

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

## 异步

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

一次异步操作的状态：**一个对象一个**（通常就是一个按钮、一次提交），彼此无关。`run` 在跑之前把 `loading`
置起来、跑完一定放下，把错误和超时转成返回值而不是抛出。

```ts
class SaveButton {
  readonly loading = new OopReactLoading();

  async click(): Promise<void> {
    const result = await this.loading.run(() => api.save(), {timeoutMs: 5000});
    if (!result.ok) this.page.feedback.error(result.timedOut ? '超时' : String(result.error));
  }

  @OopReactRender()
  view() {
    return <Button loading={this.loading.loading} onClick={() => void this.click()}>保存</Button>;
  }
}
```

**不弹提示、不记日志、不画进度条**，也不重试 —— 那些是持有它的对象的事。`timeoutMs` 只让 `run` 先返回，
任务本身不会被中断（要真取消，得把 `AbortSignal` 传进 `fetch`）。内部按次数记账，所以同一个对象上重叠两次
`run` 时，先结束的那个不会把 `loading` 关掉。

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

一份远程数据：`data` / `loading` / `error`，加上把它取回来的 `load`。失败时保留上一次的 `data` 并记下
`error`；`invalidate()` 把两者清空。没有缓存、没有去重、没有 stale-while-revalidate —— 要重新取就是再调一次
`load`，把同一个 fetcher 传进来。

### `OopReactAsyncView(resource, options)`

```ts
OopReactAsyncView<T>(resource: OopReactAsyncState<T>, options: OopReactAsyncViewOptions): ReactNode

interface OopReactAsyncState<T> {          // OopReactResource 就满足这个形状
  readonly data: T | null;
  readonly error: unknown;
}

interface OopReactAsyncViewOptions {
  skeleton: ReactNode;                     // 还没有数据
  ready: ReactNode;                        // 有数据
  failed?: (error: unknown) => ReactNode;  // 失败：没数据时占整块，有数据时显示在上面
}
```

「骨架屏 / 有数据 / 失败」三段收成一次：

```tsx
{OopReactAsyncView(this.rows, {
  skeleton: <Skeleton active />,
  ready: this.table(),
  failed: (error) => <Alert type="error" title={String(error)} />,
})}
```

它是**普通函数不是组件**：在渲染方法里调用，读到的 `data` / `error` 记在**那个岛**上，不用再包一层 observer ——
所以能放进任何只留得下一个 node 的位置（弹窗的 children、表格的 `render`、render prop 的返回值）。
失败但有旧数据时不清屏：数据留着，错误当横幅显示在上面。

## 生命周期

### `OopReactCleanup`

```ts
class OopReactCleanup {
  add(disposer: () => void): () => void;   // 返回「撤销登记」
  dispose(): void;                          // 依次执行并清空，重复调用无害
  readonly size: number;
  readonly disposed: boolean;
}
```

一个对象攒下来的清理动作：`reaction`、timer、DOM 监听、第三方实例。`dispose()` 里某一个抛错不影响其余的；
在已经 dispose 过的对象上再 `add`，会立刻执行。

## 选择

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
  set(ids: readonly K[]): void;       // 表格的 onChange 直接交进来
  clear(): void;
  isAll(total: number): boolean;      // total > 0 且全选
  isPartial(total: number): boolean;  // 选了一些、没选完
}
```

只存「选了什么」，不碰行数据：行自己问 `selection.has(row.id)`。

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
| `OopReactObserverOptions` | 函数式岛的选项（`key`） |
| `OopReactCallbackOptions<Args>` | render prop 回调的选项（`key`） |
| `OopReactRenderMethodKey<Instance>` | `Instance` 上所有返回 `ReactNode` 的方法名 |
| `OopReactComponentOptions` | 组件桥选项 |
| `OopReactAnnotations<T>` | 字段名 → MobX 注解，键受 `keyof T` 约束 |
| `OopReactObservableOptions` | `autoBind` / `deep` |
| `OopReactConfig` | 全局配置（`fallback` / `onError`） |
| `OopReactFallbackProps` | fallback 组件收到的 props |
| `OopReactErrorBoundaryProps` | 边界组件的 props |
| `OopReactTaskOptions` | `run` 的选项（`timeoutMs`） |
| `OopReactTaskResult<T>` | `run` 的返回值：成功 / 失败 / 是否超时 |
| `OopReactAsyncState<T>` | 有 `data` / `error` 的东西（`OopReactResource` 即其一） |
| `OopReactAsyncViewOptions` | 三段式的三个分支（`skeleton` / `ready` / `failed`） |
