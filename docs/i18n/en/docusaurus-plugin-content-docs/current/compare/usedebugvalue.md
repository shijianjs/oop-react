---
id: usedebugvalue
title: useDebugValue
slug: /compare/usedebugvalue
---

**React**: add a line for a custom hook in DevTools.
**Here**: not needed — the object is a plain object, its fields are visible as they are, and an island is named `<class>.<method>`.

## 原生写法

```tsx
function useOnlineStatus() {
  const status = useSyncExternalStore(...);
  useDebugValue(status ? 'Online' : 'Offline');
  return status;
}
```

## 对象写法

```ts
@OopReactState
class Presence {
  online = false;
}
// expand the instance in DevTools; no extra description needed
```

## 注意

- An island shows up in React DevTools as `<class>.<method>` (name it explicitly with `@OopReactRender({name})` for production builds).
- The business object is already inspectable in the object panel; a third description is redundant.

## 演示

Failure (`#/failure`) — the fallback prints the island name
