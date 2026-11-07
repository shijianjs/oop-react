---
id: usesyncexternalstore
title: useSyncExternalStore
slug: /compare/usesyncexternalstore
---

**React**：把外部 store 接进 React（并发安全）。
**这里**：这正是 `observer` 在做的事 —— 每个岛订阅自己读到的字段。业务代码不需要自己写。

## 原生写法

```tsx
const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
```

## 对象写法

```ts
@OopReactState
class Store {
  count = 0;

  increment(): void {
    this.count += 1;
  }
}
// 岛订阅它读到的字段；不需要手写 subscribe/getSnapshot
```

## 注意

- MobX 的订阅是细粒度的（字段级），比「整个 store 一个快照」更省。
- 要接第三方 store（Redux、Zustand），就在岛里用官方 hook，然后写进对象字段。

## 演示

所有页面（`observer` 在库内部）
