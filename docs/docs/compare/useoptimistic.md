---
id: useoptimistic
title: useOptimistic
slug: /compare/useoptimistic
---

**React**：先显示乐观结果，请求失败再回滚。
**这里**：就是「先改字段，失败改回来」，写在 `flow` 里 —— 回滚逻辑和提交逻辑在同一个方法，读起来是一件事。

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
    this.items.push(todo);                 // 乐观
    try {
      yield this.api.create(todo);
    } catch (error) {
      this.items = this.items.filter((item) => item !== todo);   // 回滚
      throw error;
    }
  }
}
```

## 注意

- 回滚不需要单独的 reducer：一个 `try/catch/finally` 就写完了，而且和提交在一起。

## 演示

⏳ 暂无（订单页的保存是本地模拟）
