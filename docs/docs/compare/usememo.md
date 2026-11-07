---
id: usememo
title: useMemo
slug: /compare/usememo
---

**React**：缓存计算结果，依赖不变就复用。
**这里**：写成 `get` 访问器 —— 自动变成 MobX 的 computed，依赖变了才算，而且只有读它的岛会重渲染。

## 原生写法

```tsx
const visible = useMemo(
  () => items.filter((item) => !item.done),
  [items],
);
```

## 对象写法

```ts
@OopReactState
class Todos {
  items: Item[] = [];

  get visible(): Item[] {
    return this.items.filter((item) => !item.done);
  }
}
```

## 注意

- 没有依赖数组要维护：computed 自己知道依赖了谁。
- 链式 computed 也安全（`paged` 依赖 `sorted` 依赖 `filtered`），没有悬空依赖的问题。

## 演示

订单（`#/orders`：`filtered` / `sorted` / `paged` / `columns`）、图表（`option`）
