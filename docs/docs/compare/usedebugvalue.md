---
id: usedebugvalue
title: useDebugValue
slug: /compare/usedebugvalue
---

**React**：给自定义 hook 在 DevTools 里加一行说明。
**这里**：不需要 —— 对象就是普通对象，DevTools 里看到的就是它的字段，岛的名字是 `类名.方法名`。

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
// DevTools 里直接展开实例看字段，不需要额外说明
```

## 注意

- 岛在 React DevTools 里是 `<类名>.<方法名>`（生产构建要用 `@OopReactRender({name})` 显式命名）。
- 业务对象本身在浏览器的对象面板里就能看，不需要第三个地方再描述一次。

## 演示

故障隔离（`#/failure`）—— fallback 里显示的就是岛名
