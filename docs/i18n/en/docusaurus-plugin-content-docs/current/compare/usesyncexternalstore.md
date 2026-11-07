---
id: usesyncexternalstore
title: useSyncExternalStore
slug: /compare/usesyncexternalstore
---

**React**: connect an external store to React (concurrently safe).
**Here**: that is what `observer` already does — each island subscribes to the fields it reads. Application code never writes it.

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
// the island subscribes to the fields it reads; no subscribe/getSnapshot to write
```

## 注意

- MobX subscriptions are field-level, cheaper than one snapshot per store.
- For a third-party store (Redux, Zustand), use the official hook in an island and write the value into an object field.

## 演示

every page (`observer` lives inside the library)
