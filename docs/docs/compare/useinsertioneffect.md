---
id: useinsertioneffect
title: useInsertionEffect
slug: /compare/useinsertioneffect
---

**React**：给 CSS-in-JS 库在插入样式前跑逻辑用的。
**这里**：不需要。样式要么是 CSS 文件，要么由 antd 的 `ConfigProvider` / CSS-in-JS 负责。

## 原生写法

```tsx
useInsertionEffect(() => {
  styleSheet.insertRule(rule);
}, [rule]);
```

## 对象写法

```ts
// 没有对应物：样式不归对象管。
// 主题切换交给 ConfigProvider（见复杂组件页），自己的样式写在 CSS 里。
```

## 注意

- 应用代码几乎永远用不到它；库作者才需要。

## 演示

—
