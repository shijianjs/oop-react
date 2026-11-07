---
id: usedeferredvalue
title: useDeferredValue
slug: /compare/usedeferredvalue
---

**React**：让某个值「晚一拍」更新，避免昂贵列表跟着输入抖。
**这里**：不封装；典型做法是把「即时输入」和「用于查询的值」分成两个字段，提交时再同步。

## 原生写法

```tsx
const deferred = useDeferredValue(query);
<List filter={deferred} />;
```

## 对象写法

```ts
@OopReactState
class Search {
  draft = '';      // 输入框绑这个
  query = '';      // 列表读这个

  setDraft(value: string): void {
    this.draft = value;
  }

  submit(): void {
    this.query = this.draft;   // 显式提交，或用防抖
  }
}
```

## 注意

- 两个字段 = 明确区分「正在输入」与「已生效」，行为比「延迟渲染」更好预测，也更容易测试。
- 需要真正的并发降级时，岛里用官方 `useDeferredValue`。

## 演示

⏳ 暂无
