---
id: complex-components
title: 复杂组件与 hooks
slug: /guide/complex-components
---

组件库会把你带回 React 的边界：provider、context、依赖组件实例的 hook。这一页是那张边界清单，
参考实现是演示站点的「订单」页（`demo/src/pages/orders/OrdersPage.tsx`）。

## 结论先给

| 你需要的东西 | 放哪 | 怎么做 |
| --- | --- | --- |
| provider（`ConfigProvider`、antd `App`、主题） | 某个岛的 JSX | 任何对象的渲染方法都能包一层，不必在应用根 |
| 副作用（`reaction` / `autorun`） | 对象里 | 构造器创建，提供 `dispose()` |
| context 提供的实例（`message` / `modal` / `notification`） | 对象里 | 用桥组件捕获一次，`useEffect` 里交给对象 |
| 只在一个岛里用的 hook（`Form.useForm`、`Modal.useModal`） | 那个岛里 | 渲染方法顶部直接调用 |
| 表格 / 表单的「视图状态」 | 对象字段 | 受控传回组件 |

## provider 不必在根部

`OrdersPage` 的表格在页面自己身上套了一层 `ConfigProvider`：

```tsx
@OopReactRender()
table() {
  return (
    <ConfigProvider componentSize="small">
      <Table columns={this.columns} dataSource={this.paged} … />
    </ConfigProvider>
  );
}
```

页面之外的组件仍然是全局尺寸 —— provider 只影响这棵子树。代价也很直接：**provider 所在的岛重渲染时，
整棵子树跟着重渲染**，所以把它放在尽量小的岛里，而不是顺手放在 `view()` 上。

antd 的 `<App>`（`App.useApp()` 的来源）同理，只是它不仅提供样式，还提供 `message` 等实例。

## `reaction` 属于对象

副作用不一定要写在应用入口。谁拥有状态，谁就可以拥有跟随它的副作用：

```ts
export class Settings {
  theme: 'light' | 'dark' = 'light';
  locale: 'zh' | 'en' = 'zh';
  #dispose: (() => void) | null = null;

  constructor() {
    OopReactObservable(this);
    this.#dispose = reaction(
      () => [this.theme, this.locale] as const,
      ([theme, locale]) => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : 'en';
      },
      {fireImmediately: true},
    );
  }

  dispose(): void {
    this.#dispose?.();
    this.#dispose = null;
  }
}
```

:::caution 不要在渲染方法里建 reaction
渲染方法会被重复调用，每次建一个 reaction 就是一次泄漏。副作用属于对象的生命周期，不属于某次渲染。
:::

## hook 在渲染方法里能用

岛本身就是一个组件，所以渲染方法里可以调 hook：

```tsx
@OopReactRender()
dialog() {
  const [form] = Form.useForm<OrderDraft>();   // 没问题
  return <Modal onOk={() => form.submit()}>…</Modal>;
}

@OopReactRender()
toolbar() {
  const [modal, holder] = Modal.useModal();
  return (
    <>
      {holder}
      <Button onClick={() => modal.confirm({title: '…', onOk: () => this.reset()})}>重置</Button>
    </>
  );
}
```

三条规则和普通组件完全一致，只是容易忘：

1. **调用顺序必须稳定。** 不能出现在 `if (...) return …` 之后。像 `content()` 这种会提前抛错或提前返回的方法，
   不要在它里面用 hook。
2. **hook 实例属于那个岛。** 同一个渲染方法被两个父岛分别调用，就是两份实例；页面切走、岛卸载，实例就没了
   （表单内容会重置）。
3. **hook 的返回值不要写到对象上。** 渲染过程中写状态会触发「渲染中更新」，和普通 React 里一样是错的。

## 桥：把 context 实例交给对象

`message` / `modal` / `notification` 这类只存在于 context 里的东西，对象方法要用，就先捕获一次：

```tsx
export class Feedback {
  #message: MessageInstance | null = null;

  bind(message: MessageInstance): void {
    this.#message = message;
  }

  success(text: string): void {
    void this.#message?.success(text);
  }
}

export function FeedbackBridge({feedback}: {feedback: Feedback}) {
  const {message} = AntApp.useApp();

  useEffect(() => {
    feedback.bind(message);
  }, [feedback, message]);

  return null;
}
```

挂载在同一个 provider 下面、`app.view()` 之前：

```tsx
<ConfigProvider …>
  <AntApp>
    <FeedbackBridge feedback={app.feedback} />
    {app.view()}
  </AntApp>
</ConfigProvider>
```

之后 `OrdersPage.save()` 里就能直接 `this.app.feedback.success('已保存')`。三点值得注意：

- 必须在 `useEffect` 里交接 —— 渲染中写对象就是渲染中写状态；
- 桥必须挂在实际提供该 context 的 provider 之下，否则拿到的是默认值；
- 桥是 8 行代码，库没有替你封装 —— 见文末「已知边界」。

## 表单状态放哪

三种做法，按需要选：

| 做法 | 状态在哪 | 适合 |
| --- | --- | --- |
| 受控字段全放对象 | 对象 | 别的对象要读/改表单值；愿意自己写校验 |
| `Form` 持有值，对象持有记录 | 组件 | 想要 antd 的校验引擎（demo 的选择） |
| 把 `Form` 实例捕获到对象 | 对象持有组件实例 | 需要在对象方法里 `form.setFieldsValue()` |

demo 用的是第二种：`Modal` 打开时把 `formKey` 加一让 `Form` 重挂载，`initialValues` 负责回填当前记录，
`onFinish` 把值交回 `this.save()`。这样不需要在任何地方保存表单实例。

第三种的做法和 `Feedback` 一样，只是捕获的是 `Form.useForm()` 的返回值。

## 表格的受控状态

分页、排序、选中、筛选都可以是对象字段（`page` / `pageSize` / `sortField` / `selected`），
`dataSource` 用 computed 派生。好处是这些状态也能被别的对象读和改（比如左上角加一个「只看本周」按钮，
就是给另一个页面对象发个方法调用）；代价是这些逻辑要自己写，而交给 antd 内部状态就不用写 ——
但那样它就不在对象图里，别的对象改不动它。

## 大页面怎么拆

`OrdersPage` 拆成三个岛：`toolbar`（搜索/筛选/批量操作）、`table`（表格 + 嵌套 provider）、
`dialog`（受校验的表单）。表单岛的 hook 不会影响另外两个岛；`columns` 是 computed getter，
换语言时表格自己重渲染，页头不动。

## 已知边界

诚实地列出来，这些是当前版本没做的：

- **没有自动注入 context 实例。** `App.useApp()` / `message.useMessage()` 这类要对象用，得自己写桥（约 8 行）。
- **岛卸载后 hook 状态会丢。** 路由切走再回来，表单和 `Modal.useModal()` 的实例都是新的；要跨页面保留，
  就把状态放对象上，而不是 hook 里。
- **渲染方法里不能写状态**，包括「把 hook 的返回值存到字段上」。
- **SSR 与并发渲染没有验证过**。`ObservedRender` 在渲染期同步跑 `reaction.track`，服务端渲染理论上可行，
  但没有测试覆盖。
- **`Table` 的虚拟滚动、`Form.List` 之类重度内部状态的组件**没有专门试验过；按上面的规则它们是普通受控组件，
  预期可用，但没进 demo。
