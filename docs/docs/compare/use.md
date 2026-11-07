---
id: use
title: use（读 Promise）
slug: /compare/use
---

**React 19**：在渲染中读 Promise，配合 `Suspense`。
**这里**：渲染方法里不 `await` —— 异步放在 `flow`（或普通 `async` 方法）里做完再写字段。渲染方法只读字段，永远同步。

## 原生写法

```tsx
const data = use(fetchProfile());   // 需要 Suspense 包裹
```

## 对象写法

```ts
@OopReactState
class Profile {
  data: Profile | null = null;
  loading = false;

  *load(): Generator<Promise<unknown>, void, unknown> {
    this.loading = true;
    try {
      this.data = (yield this.api.profile()) as Profile;
    } finally {
      this.loading = false;
    }
  }

  @OopReactRender()
  view() {
    if (this.data === null) return <Skeleton active />;
    return <ProfileCard data={this.data} />;
  }
}
```

## 这一页为什么用 generator（它是可选的）

`*load()` 是 generator，但调用方拿到的是普通 Promise：`@OopReactState`（以及 `OopReactObservable`）把
generator 方法标成 MobX 的 `flow`，`yield` 的语义和 `await` 一样。

**严格模式默认关着，所以这里完全可以用 `async/await`**：`await` 之后写字段不会告警。这一页选 `flow` 是因为它是
一次多步流程 —— 每个 `yield` 之后的代码都在一个 action 里，`loading → 数据 → 收尾` 每一步是一次通知，
返回的 `CancellablePromise` 还能在离开页面时取消。

换成 `async` 就是：

```ts
async load(): Promise<void> {
  this.loading = true;
  try {
    this.data = await this.api.profile();
  } finally {
    this.loading = false;
  }
}
```

同样能跑，只是这几处写入各自通知一次观察者；想合成一次就用 `runInAction` 把收尾包起来。

如果宿主项目把严格模式打开了（`OopReactConfigure({enforceActions: 'always'})`），`await` 之后的每次写入
会逐条 `console.warn`（MobX 7 是警告，不是异常），这时 `flow` 更省心。

如果公开的方法签名不想出现 `Generator`，写成字段形式 —— 类型就是运行时那个函数：

```ts
readonly load = flow(function* (this: Profile) {
  this.loading = true;
  try {
    this.data = yield this.api.profile();
  } finally {
    this.loading = false;
  }
});
```

## 注意

- `await` 之后 `this.data` 一定是最新值，没有闭包过期的问题；取消/竞态用一个 `#token` 字段判断即可。
- 渲染方法保持同步是硬规则：它可能被 React 重跑任意次。

## 演示

订单（`#/orders`）：`flow` 提交 + `saving`
