---
id: useinsertioneffect
title: useInsertionEffect
slug: /compare/useinsertioneffect
---

**React**: for CSS-in-JS libraries to run logic before styles are inserted.
**Here**: not needed. Styles are either CSS files or antd's `ConfigProvider` / CSS-in-JS.

## 原生写法

```tsx
useInsertionEffect(() => {
  styleSheet.insertRule(rule);
}, [rule]);
```

## 对象写法

```ts
// no counterpart: styles are not the object's business.
// theme switching goes through ConfigProvider; custom styles live in CSS.
```

## 注意

- Application code essentially never needs it; library authors do.

## 演示

—
