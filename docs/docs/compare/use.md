---
id: use
title: use（读 Promise）
slug: /compare/use
---

**React 19**：在渲染中读 Promise，配合 `Suspense`。
**这里**：渲染方法永远同步；异步放在普通的 `async` 方法里做完，再写字段。

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

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.data = await this.api.profile();
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

严格模式默认关着，`await` 之后写字段不会告警；每次写入各自通知一次观察者，通常无所谓。要把连续几行合成
一次通知，抽成一个方法（方法本身是 action）或用 `runInAction` 包起来。

## 明确要用 `yield` 时：`flow`

MobX 的 `flow` 是 generator 写法，`yield` 等于 `await`，区别是**每个 `yield` 之后的代码会重新进入一个 action**：

```ts
import {flow} from 'mobx';

readonly load = flow(function* (this: Profile) {
  this.loading = true;
  try {
    this.data = yield this.api.profile();   // 这一步也在 action 里
  } finally {
    this.loading = false;
  }
});
```

它换来的是：多步流程每一步都是事务、返回 `CancellablePromise` 可取消、宿主打开严格模式时也不会逐条告警。
只有确实需要这些时才用；普通异步一律 `async/await`。generator **方法**也会被标成 flow，但 TypeScript 眼里
它还是 `Generator`，调用方得断言，所以写成字段更好。

## 注意

- `await` / `yield` 之后 `this.data` 一定是最新值，没有闭包过期的问题；取消/竞态用一个 `#token` 字段判断即可。
- 渲染方法保持同步是硬规则：它可能被 React 重跑任意次。

## 演示

订单（`#/orders`）：`async` 提交 + `saving`
