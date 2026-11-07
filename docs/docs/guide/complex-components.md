---
id: complex-components
title: 复杂组件与 hooks
slug: /guide/complex-components
---

组件库会把你带回 React 的边界：provider、context、依赖组件实例的 hook。这一页是那张边界清单，
参考实现是演示站点的「订单」页（`demo/src/pages/orders/`）。

## 结论先给

| 你需要的东西 | 放哪 | 怎么做 |
| --- | --- | --- |
| provider（`ConfigProvider`、antd `App`、主题） | 某个岛的 JSX | 任何对象的渲染方法都能包一层，不必在应用根 |
| 副作用（`reaction` / `autorun`） | 对象里 | 构造器创建，提供 `dispose()` |
| context 提供的实例（`Form`、`message`、`modal`） | 对象里 | `OopReactBridge` 交接一次，之后对象随便调 |
| 只在一个岛里用、不给对象用的 hook | 那个岛里 | 渲染方法顶部直接调用 |
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

页面之外仍然是全局尺寸 —— provider 只影响这棵子树。**代价**：provider 所在的岛重渲染时，这棵子树里的
普通 React 组件会跟着重渲染；**嵌在里面的岛不会**，因为岛是 memo 的（见[渲染方法](./render-methods.md)），
它的 props 没变就跳过。所以 provider 放在多深的岛上都行，放在需要它的最小岛里最好。

连应用级的 provider 也不需要一层专门的 React 组件：demo 的 `App.root()` 就是这样一个渲染方法 ——
`ConfigProvider` + `<AntApp>` 包着 `this.view()`，入口只写 `createRoot(el).render(app.root())`。
antd 组件通过 context 拿新主题，所以外层岛重渲染（或被 memo 跳过）都不影响它们跟着变色。

## `reaction` 属于对象

副作用不一定要写在应用入口。谁拥有状态，谁就可以拥有跟随它的副作用：

```ts
export class Settings {
  theme: 'light' | 'dark' = 'light';
  #dispose: (() => void) | null = null;

  constructor() {
    OopReactObservable(this);
    this.#dispose = reaction(
      () => this.theme,
      (theme) => {
        document.documentElement.dataset.theme = theme;
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

岛本身就是一个组件，所以渲染方法里可以调 hook。三条规则和普通组件一致，只是容易忘：

1. **调用顺序必须稳定。** 不能出现在 `if (...) return …` 之后；会提前抛错或提前返回的方法（比如 `content()`）
   里不要用 hook。
2. **实例属于那个岛。** 同一个渲染方法被两个父岛分别调用就是两份；岛卸载（路由切走）实例就没了。
3. **hook 的返回值不要写到对象上。** 渲染过程中写状态会触发「渲染中更新」。要给对象用，走下面的桥。

## 桥：把实例交给对象

`Form` / `message` / `modal` 这些只存在于 context 里的东西，对象方法要用，就用 `OopReactBridge` 交接一次：

```tsx
function FeedbackHost({feedback}: {feedback: Feedback}) {
  const {message} = AntApp.useApp();
  return <OopReactBridge value={message} assign={feedback.bind} release={() => feedback.bind(null)} />;
}
```

它渲染 `null`，只做一件事：**在 commit 之后**（`useEffect` 里）把值交给对象，值变了再交一次，卸载时调
`release`。之后 `this.app.feedback.success('已保存')` 在任何对象方法里都能用。

:::caution 必须在 effect 里交接
渲染中写对象就是渲染中写状态，会触发「渲染过程中更新另一个组件」的警告。桥把它关在 `useEffect` 里，这就是它存在的意义。
:::

## 表单是对象，不是渲染方法里的局部变量

这是最容易做错的一步：把 `Form.useForm()` 的结果留在渲染方法里，对象就永远碰不到表单 ——
`setFieldsValue`、`validateFields`、`resetFields` 全都只有组件能调，表单实际上退化成了一张「受控的 HTML」。

正确做法是让对象持有这个实例：

```tsx
export class OrderEditor {
  open = false;
  saving = false;
  #form: FormInstance<OrderDraft> | null = null;

  bindForm(form: FormInstance<OrderDraft> | null): void {
    this.#form = form;
  }

  /** 校验由对象发起，通过之后再交给页面保存 */
  async submit(): Promise<void> {
    const form = this.#form;
    if (form === null) return;

    let values: OrderDraft;
    try {
      values = await form.validateFields();
    } catch {
      return; // antd 已经把错误标在字段上了，弹窗留着
    }

    this.saving = true;
    try {
      await this.page.save(values);
      form.resetFields();
      this.open = false;
    } finally {
      this.saving = false;
    }
  }

  @OopReactRender()
  dialog() {
    const [form] = Form.useForm<OrderDraft>();   // hook 在岛里，实例立刻交给对象
    return (
      <>
        <OopReactBridge value={form} assign={this.bindForm} release={this.releaseForm} />
        <Modal open={this.open} onOk={() => void this.submit()}>
          <Form form={form} initialValues={this.initialValues}>…</Form>
        </Modal>
      </>
    );
  }
}
```

于是：

- **提交由对象驱动**：点 OK 调的是 `editor.submit()`，先 `validateFields()`，再 `page.save()`；
- **重置由对象驱动**：`editor.resetFields()`；
- **初值也能由别处决定**：工具栏里的另一个岛调 `this.editor.create({customer: '示例客户'})`，
  编辑器把参数放进 `preset`，表单的 `initialValues` 读它 —— 两个岛之间没有 props、没有 context。

这正是「表单被八竿子打不着的地方调用」的形态：调用方只知道 `editor.create(...)`，不知道 `Form` 的存在。

## 表单状态放哪

| 做法 | 状态在哪 | 适合 |
| --- | --- | --- |
| 全受控，值都在对象字段 | 对象 | 别的对象要读/改表单值，愿意自己写校验 |
| `Form` 管值，对象管记录 | 组件 | 只要 antd 的校验引擎，不需要在对象里操作表单 |
| **实例交给对象**（推荐） | 对象持有组件实例 | 对象要调 `validateFields` / `setFieldsValue` / `resetFields` |

demo 用的是第三种。第二种也留着：不是所有表单都需要模型驱动。

## 表格的受控状态

分页、排序、选中、筛选都可以是对象字段（`page` / `pageSize` / `sortField` / `selected`），
`dataSource` 用 computed 派生。好处是这些状态也能被别的对象读和改；代价是逻辑要自己写，
而交给 antd 内部状态就不用写 —— 但那样它就不在对象图里，别的对象改不动它。

## 大页面怎么拆

订单页拆成三个文件：

| 文件 | 职责 |
| --- | --- |
| `pages/orders/model.ts` | 类型与种子数据，没有 React |
| `pages/orders/OrdersPage.tsx` | 表格状态、列定义、工具栏与表格两个岛、`save()` |
| `pages/orders/OrderEditor.tsx` | 表单对象：开合、初值、校验、提交、重置 |

页面的 `view()` 只做组装：`{this.toolbar()}{this.table()}{this.editor.dialog()}`。
工具栏和表格是两个岛，随便动一边不会重跑另一边；弹窗是第三个岛，只在编辑器状态变化时重跑。

## 已知边界

- **桥必须挂在实际提供该 context 的 provider 之下**，否则拿到的是默认值。
- **岛卸载后 hook 状态会丢。** 路由切走再回来，`Form` 实例是新的；要跨页面保留就把状态放对象上。
- **渲染方法里不能写状态**，包括「把 hook 的返回值存到字段上」—— 交给桥。
- **`Form.List`、`Table` 虚拟滚动**这类重度内部状态的组件没有专门试验过；按上面的规则它们就是普通受控组件，
  预期可用，但没进 demo。
- **SSR 与并发渲染未验证。**
