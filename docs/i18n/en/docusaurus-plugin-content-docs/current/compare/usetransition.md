---
id: usetransition
title: useTransition
slug: /compare/usetransition
---

**React**: mark an update as non-urgent so typing stays responsive.
**Here**: not wrapped. State lives on the object; use the official hook inside an island when needed — more often a `busy` field plus an `async` method is enough.

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

  async run(next: string): Promise<void> {
    this.query = next;
    this.busy = true;
    try {
      await this.search(next);   // the expensive part
    } finally {
      this.busy = false;
    }
  }
}
```

## 注意

- Janky typing is usually synchronous heavy work; moving it into an `async` method keeps the UI free.
- When the concurrent feature is really wanted, call `useTransition()` inside an island — an island is a component, official hooks included.

## 演示

⏳ not yet (the orders search filters synchronously)
