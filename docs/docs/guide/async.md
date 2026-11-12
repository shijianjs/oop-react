---
id: async
title: 异步与加载状态
slug: /guide/async
---

「按钮转圈、数据还没回来、请求超时」这类事，在对象图里同样是对象：一个按钮一个加载状态，一份数据一个
resource。库只给机制（`OopReactLoading` / `OopReactResource`），**弹什么提示、进度条长什么样、按钮怎么变灰，
都是持有它的对象自己决定**。

## 一个按钮一个加载状态

```tsx title="SaveButton.tsx"
class SaveButton {
  readonly loading = new OopReactLoading();

  async click(): Promise<void> {
    const result = await this.loading.run(() => api.save(this.order), {timeoutMs: 5000});
    if (!result.ok) this.page.feedback.error(result.timedOut ? '超时了' : String(result.error));
  }

  @OopReactRender()
  view() {
    return (
      <Button loading={this.loading.loading} onClick={() => void this.click()}>
        保存
      </Button>
    );
  }
}
```

- `loading` 是它唯一的公开状态，按钮的 `loading` 属性直接吃它 —— 转圈和「不可点」都是组件库的事，不用自己画遮罩；
- 每个按钮各有各的实例，点这个不影响那个：不需要 provider，也不需要把状态往上提；
- 内部按次数记账，同一个按钮上重叠两件事时，先结束的那个不会把 `loading` 关掉。

## 失败和超时

`run` 不抛错，把结果放进返回值：

```ts
const result = await this.loading.run(() => api.save(), {timeoutMs: 5000});

if (result.ok) {
  this.page.feedback.success('已保存');
} else if (result.timedOut) {
  this.page.feedback.error('超时了');
} else {
  this.page.feedback.error(String(result.error));
}
```

- 调用方少一层 `try`，也不会忘了在 `finally` 里复位 —— 复位是 `run` 保证的；
- `timeoutMs` 只让 `run` 先返回，**任务本身还在跑**。真要取消，把 `AbortSignal` 传给 `fetch`；
- 超时算不算失败、失败要不要重试，都是调用方的判断，库不替你决定。

## 一份数据一个 resource

转圈只是过程，真正要拿的是数据：

```tsx title="OrdersPage.tsx"
class OrdersPage {
  readonly orders = new OopReactResource<Order[]>();

  async open(): Promise<void> {
    await this.orders.load(() => api.orders());
  }

  @OopReactRender()
  view() {
    if (this.orders.loading.loading && this.orders.data === null) return <Spin />;

    return (
      <Space direction="vertical" size="small">
        {this.orders.error ? <Alert type="error" message={String(this.orders.error)} /> : null}
        <Table dataSource={this.orders.data ?? []} />
      </Space>
    );
  }
}
```

`data` / `error` / `loading` 三个字段正好对应三种界面：还没有数据、旧数据加一条错误、新数据。
失败时保留上一次的 `data`（屏幕上不用清空），`invalidate()` 才是「回到空白」。

**没有缓存、没有去重、没有 stale-while-revalidate**：那一层策略一进来就得跟着框架走（失效时机、重试、
并发取消）。要重新取，就再调一次 `load`，把同一个 fetcher 传进去。

## 回调里只有一个 node 的位置

弹窗的 `children`、抽屉的 body、表格的 `render`、回调组件的返回值 —— 这些地方只能交出去一个 node，而数据是
异步来的。于是每个地方都要抄一遍：

```tsx
if (error && data === null) return <Alert type="error" title={String(error)} />;
if (data === null) return <Skeleton active />;
return <Table dataSource={data} />;
```

把这三段收成一次，用起来只剩一行：

```tsx
{asyncView(this.rows, {
  skeleton: <Skeleton active />,
  ready: this.table(),
  failed: (error) => <Alert type="error" title={String(error)} />,
})}
```

`asyncView` 是 demo 里的普通函数（`demo/src/app/AsyncView.tsx`）。关键在**它不是组件**：在渲染方法里调用时，
读到的 `data` / `error` 记在**那个岛**上，不用再包一层 observer —— 所以它能塞进任何只留给一个 node 的位置。
有旧数据时失败了也不清屏：数据照旧，错误作为一条横幅显示在上面（清空是 `invalidate()` 的事）。

React 19 有一个对应的官方做法：`use(promise)` 配 `<Suspense fallback>`，一段标签管住「没数据时画什么」。
区别是它按**边界**兜底（最近的 Suspense），两个异步区块就是两层边界，失败还要另配 ErrorBoundary，而且要求
那个 promise 在多次渲染之间保持同一个。这里的 `data` / `error` 本来就是对象上的字段，读一下就知道该画哪一段：
不用挂起，也不需要祖先上有 Suspense。

## 全局进度条为什么不在库里

NProgress 那种顶部条是 UI + 全局策略：谁先结束谁关、要不要计数、失败了变不变红。演示里它就是 `App` 上的
一个 `Progress` 对象、三十行；库如果内建，就得替你决定样式、位置和冲突策略 —— 那正是这个库一直不做的事。

## 顺手收尾：清理

一个对象攒下来的清理动作（`reaction`、timer、DOM 监听、第三方实例）放进一个 `OopReactCleanup`：

```ts
class Poller {
  readonly cleanup = new OopReactCleanup();

  start(): void {
    const timer = setInterval(() => void this.refresh(), 5000);
    this.cleanup.add(() => clearInterval(timer));
  }

  dispose(): void {
    this.cleanup.dispose();
  }
}
```

一个清理动作抛错不会挡住其余的；已经 `dispose()` 之后再 `add`，会立刻执行 —— 漏清理比晚清理难查。

## 演示

演示站点的「加载状态」页（`demo/src/pages/loading/`）里，四个按钮就是四个对象，各带一个 `OopReactLoading`：
失败统一提示、慢请求超时、顶上那条是全局的、下面那张卡片是另一个对象自带的按钮。
