---
id: memo
title: React.memo
slug: /compare/memo
---

**React**: wrap in `memo`; skip rendering when props are shallow-equal.
**Here**: islands carry that comparison, and they compare (instance + method + name + arguments), not a props object.

## 原生写法

```tsx
const Row = memo(function Row({item, onToggle}) { … });
```

## 对象写法

```ts
@OopReactState
class Item {
  done = false;

  @OopReactRender({key: (self: Item) => self.id})
  row() {
    return <li>{this.title}</li>;
  }
}

// when the parent island re-renders, rows whose arguments did not change are skipped
{this.items.map((item) => item.row())}
```

## 注意

- This is what makes "split it as fine as you like" true: a parent re-render does not re-execute every render method below it.
- Arguments are compared shallowly: a different `item` object re-runs the row, mutating a field of the same one does not (its own subscription does).
- `OopReactObserver` / `OopReactCallback` do not get this (they receive a new function every render); the docs say so.

## 演示

every page; the library test is `isolation.test.tsx`
