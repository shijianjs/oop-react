---
id: useoptimistic
title: useOptimistic
slug: /compare/useoptimistic
---

**React**: show the optimistic result first, roll back if the request fails.
**Here**: change the field first and change it back on failure, inside a `flow` — submit and rollback sit in one method.

## 原生写法

```tsx
const [optimistic, addOptimistic] = useOptimistic(items, (state, next) => [...state, next]);
addOptimistic(item);
await save(item);
```

## 对象写法

```ts
@OopReactState
class Todos {
  items: Todo[] = [];

  *add(todo: Todo): Generator<Promise<unknown>, void, unknown> {
    this.items.push(todo);                 // optimistic
    try {
      yield this.api.create(todo);
    } catch (error) {
      this.items = this.items.filter((item) => item !== todo);   // rollback
      throw error;
    }
  }
}
```

## 注意

- No separate reducer for the rollback: one `try/catch/finally` next to the submit explains both.

## 演示

⏳ not yet (the orders save is simulated locally)
