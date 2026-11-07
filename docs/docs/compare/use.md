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

## 注意

- `await` 之后 `this.data` 一定是最新值，没有闭包过期的问题；取消/竞态用一个 `#token` 字段判断即可。
- 渲染方法保持同步是硬规则：它可能被 React 重跑任意次。

## 演示

订单（`#/orders`）：`flow` 提交 + `saving`
