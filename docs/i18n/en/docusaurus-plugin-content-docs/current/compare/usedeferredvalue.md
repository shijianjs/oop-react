---
id: usedeferredvalue
title: useDeferredValue
slug: /compare/usedeferredvalue
---

**React**: let a value lag one step behind so an expensive list does not jitter while typing.
**Here**: not wrapped; the usual shape is two fields — the live input and the value the query uses.

## 原生写法

```tsx
const deferred = useDeferredValue(query);
<List filter={deferred} />;
```

## 对象写法

```ts
@OopReactState
class Search {
  draft = '';      // the input binds this
  query = '';      // the list reads this

  setDraft(value: string): void {
    this.draft = value;
  }

  submit(): void {
    this.query = this.draft;   // explicit, or debounce it
  }
}
```

## 注意

- Two fields make "typing" and "applied" explicit — more predictable and easier to test than deferred rendering.
- For real concurrency, use the official `useDeferredValue` inside an island.

## 演示

⏳ not yet
