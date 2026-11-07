---
id: usetransition
title: useTransition
slug: /compare/usetransition
---

**React**：把一次更新标记为「不紧急」，让输入保持流畅。
**这里**：不封装。状态在对象上，需要时在岛里用官方 hook；更多时候一个 `busy` 字段加 `flow` 就够了。

## 原生写法

```tsx
const [isPending, startTransition] = useTransition();
startTransition(() => setQuery(next));
```

## 对象写法

```ts
@OopReactState
class Search {
  query = '';
  busy = false;

  *run(next: string): Generator<Promise<unknown>, void, unknown> {
    this.query = next;
    this.busy = true;
    try {
      yield this.search(next);   // 长任务
    } finally {
      this.busy = false;
    }
  }
}
```

## 注意

- 「输入卡顿」的根因通常是同步做了重活；这里把它挪到 `flow` 里，UI 自然不阻塞。
- 确实需要并发特性时，岛里直接 `useTransition()` —— 岛就是组件，官方 hook 照常可用。

## 演示

⏳ 暂无（订单页的搜索是同步过滤）
