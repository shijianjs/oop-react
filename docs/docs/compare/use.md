---
id: use
title: use（读 Promise）
slug: /compare/use
---

**React 19**：在渲染中读 Promise，配合 `Suspense`。
**这里**：渲染方法里不 `await` —— 用 `flow` 把异步做完再写字段。渲染方法只读字段，永远同步。

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

## 为什么是 generator，不是 `async`

`*load()` 是 generator，但调用方拿到的是普通 Promise：`@OopReactState`（以及 `OopReactObservable`）
把 generator 方法标成 MobX 的 `flow`。这不是语法偏好，是因为 **MobX 的 action 边界在 `await` 处就断了**：

- `async` 方法整体是一个 action，但 `await` 之后的代码已经不在 action 里。MobX 默认开着严格模式，此时写
  被观察的字段会直接抛 `Since strict-mode is enabled, changing (observed) observable values without using an
  action is not allowed`。
- `flow` 在每次 `yield` 之后重新进入一次 action，所以「先设 loading → 请求 → 写结果 → 收尾」每一步都合法，
  中途也不会把半成品状态暴露给观察者。

两种情况下 `async/await` 完全没问题：

1. `await` 之后不写被观察的状态（只是算一算、返回个值）；
2. 用 `runInAction(() => { … })` 把 `await` 之后的写入包起来。

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
