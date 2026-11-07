---
id: usememo
title: useMemo
slug: /compare/usememo
---

**React**: cache a computed value until its dependencies change.
**Here**: write a `get` accessor — it becomes a MobX computed, recalculated only when its inputs change, and only the islands reading it re-render.

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

- No dependency array to maintain: the computed knows what it read.
- Computed chains are safe too (`paged` → `sorted` → `filtered`); there is no stale-dependency class of bug.

## 演示

Orders (`#/orders`: `filtered` / `sorted` / `paged` / `columns`), Chart (`option`)
