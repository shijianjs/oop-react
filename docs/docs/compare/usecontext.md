---
id: usecontext
title: useContext
slug: /compare/usecontext
---

**React**：provider 放值，深层组件 `useContext` 取。
**这里**：需要什么就持有那个对象（构造器注入），不需要 provider。

## 原生写法

```tsx
const ThemeContext = createContext('light');

function Deep() {
  const theme = useContext(ThemeContext);
  return <span>{theme}</span>;
}

<TemeContext.Provider value="dark"><Deep /></ThemeContext.Provider>
```

## 对象写法

```ts
class DeepThing {
  readonly settings: Settings;   // 构造器注入

  constructor(settings: Settings) {
    this.settings = settings;
  }

  @OopReactRender()
  view() {
    return <span>{this.settings.theme}</span>;
  }
}

// 任何地方 new DeepThing(app.settings) 都可以
```

## 注意

- context 解决的是「传不过去」，而对象可以直接拿到引用：`this.app.settings`。
- 需要 React context 时（antd 的 theme/locale）仍然照常用 —— provider 由某个岛渲染，见[复杂组件与 hooks](../guide/complex-components.md)。

## 演示

全站：`t()` 与主题都来自 `App.settings`
