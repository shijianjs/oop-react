---
id: react-hooks
title: React 写法 → 对象写法
slug: /compare/react-hooks
sidebar_position: 1
---

这张表把官方 [Hooks 参考](https://zh-hans.react.dev/reference/react/hooks) 逐个对到对象图里的写法。
「demo」一列指向演示站点里能动手试的页面，标 ⏳ 的表示只有这一页的代码说明、演示里还没有专门的页面。

## 总表

| React | 这里的做法 | demo |
| --- | --- | --- |
| [`useState`](./usestate.md) | 字段；多个 state 就是多个字段 | 计数器、待办、订单 |
| [`useReducer`](./usereducer.md) | 一个方法（或几个方法）改一组字段；复杂时用一个专门的「状态」子对象 | 订单（`OrdersPage`） |
| [`useContext`](./usecontext.md) | 直接持有那个对象（`this.app.settings`） | 全站：`t()` 来自 `App.settings` |
| `useRef`（存值） | 普通字段；不想被观察就 `@OopReactIgnore` | 订单（`OrderEditor` 持有表单实例） |
| `useRef`（拿 DOM） | 只在需要 DOM 的薄组件里用 | 图表（`EChart` 内部） |
| `useImperativeHandle` / `forwardRef` | 把实例交给对象（`OopReactBridge`），调用方直接调方法 | 订单（`OrderEditor`） |
| [`useEffect`](./useeffect.md) | 对象的 `reaction` / 方法里的副作用；组件卸载由对象生命周期管 | 设置（`Settings` 里的主题同步） |
| [`useLayoutEffect`](./uselayouteffect.md) | 同上，需要同步测量时仍在薄组件里 | ⏳ |
| [`useInsertionEffect`](./useinsertioneffect.md) | 不需要：样式由 `ConfigProvider` / CSS-in-JS 负责 | — |
| [`useDebugValue`](./usedebugvalue.md) | 不需要：对象在 DevTools 里就是普通对象 | — |
| [`useMemo`](./usememo.md) | `get` 访问器（computed） | 订单（`paged` / `columns`）、图表（`option`） |
| [`useCallback`](./usecallback.md) | 实例方法（构造器里已绑定，引用稳定） | 全站：`onClick={this.bump}` |
| [`memo`](./memo.md) | 岛自己就是 memo 的（实例 + 方法 + 名字 + 参数） | 所有页面 |
| `useTransition` / `useDeferredValue` | 未封装；状态在对象上，需要时在岛里用官方 hook | ⏳ |
| [`useId`](./useid.md) | 未封装；表单控件的 label 由 antd 生成 | ⏳ |
| [`useSyncExternalStore`](./usesyncexternalstore.md) | 不需要：订阅由 `observer` 负责 | — |
| `useOptimistic` / `useActionState` / `useFormStatus` | 乐观更新 = 先改对象字段，失败再改回来（`async` 方法里做） | ⏳ |
| `use`（React 19，读 Promise） | 对象方法 `await` 之后写字段；渲染方法里不 `await` | 订单（`async` 提交） |
| `Suspense` / `lazy` | 未封装：路由与页面都是同步对象，按需 `import()` 仍在边界用 | ⏳ |
| 错误边界 | 每个岛自带一个，另有 `OopReactErrorBoundary` | 故障隔离 |
| `createPortal` | 需要时在渲染方法里直接用 | 弹窗（antd `Modal`） |
| HOC | 不需要：横切逻辑写在对象上，或让对象持有那个能力 | 见下 |
| render props | 不需要：把对象传下去/直接调用方法 | `OopReactCallback` 保留给外部 API |

## 几个展开

### 多个 `useState`

```tsx
// React
const [draft, setDraft] = useState('');
const [items, setItems] = useState<Item[]>([]);
const [selected, setSelected] = useState<Item | null>(null);
```

```ts
// 对象
class Todos {
  draft = '';
  items: Item[] = [];
  selected: Item | null = null;

  constructor() {
    OopReactObservable(this);
  }
}
```

字段之间可以直接互相读，不需要 effect 去同步；`selected` 变了，只有读它的那个岛重渲染。

### `useRef` 存一个「不会触发渲染」的值

```ts
class OrderEditor {
  @OopReactIgnore #form: FormInstance<Draft> | null = null;   // 普通字段
}
```

`@OopReactIgnore` 等价于「这个字段不参与订阅」，比 `useRef` 多的是：它仍然可以被别的方法读，
而且子类会继承这个标记。

### `useEffect` 的三种常见用途

| 用途 | 这里 |
| --- | --- |
| 订阅外部状态（主题、语言、路由） | 对象的 `reaction`，构造器里建、`dispose()` 释放 |
| 数据请求 | 对象方法里的 `async/await` |
| 操作 DOM / 第三方实例 | 薄组件里的 `useEffect`（`EChart`）；或者实例交给对象（`OopReactBridge`） |

### 异步：`await` 不再是雷区

React 里 `await` 之后拿到的是**闭包里的旧值**，所有「请回答我当前值是多少」的问题都从这里来。
对象方法里的 `await` 之后，`this.xxx` 永远是当前值：

```ts
async submit(): Promise<void> {
  const values = await this.#form!.validateFields();
  await this.page.save(values);       // page.save 是 async 方法
  this.open = false;                  // 一定是最新的 this
  this.page.app.feedback.success('已保存');
}
```

### HOC

React 里 HOC 解决的「横切能力」，这里有两个更直接的替代：

- **对象持有能力**：需要「能弹提示」就持有 `feedback`，需要「能读当前用户」就持有 `session`；
- **薄组件**：确实需要一个 React 组件包装第三方组件时（`EChart`），写一个普通组件，用 props 传值。

只有要在别人的 React 代码里复用一块 UI 时，才需要 `OopReactComponent` / `OopReactObserver`。

## 演示里对应的页面

| 页面 | 演示了什么 |
| --- | --- |
| 计数器 | 字段即状态、方法即回调 |
| 待办 | 一对多、computed、一对一引用 |
| 订单 | 表格受控状态、表单实例交给对象、`async` 提交、校验 |
| 包装组件 | 外壳是对象、内容也是对象 —— 用 `body` 代替 `children` |
| 井字棋 | 官方教程全量作业：快照历史、computed 判胜、两层循环渲染 |
| 图表 | 命令式库（ECharts）的薄组件封装 |
| 动画 | CSS 过渡 + `react-spring`（hook 在岛里） |
| 故障隔离 | 每个岛一个错误边界 |
