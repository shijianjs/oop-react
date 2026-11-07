---
id: usecontext
title: useContext
slug: /compare/usecontext
---

**React**: a provider holds the value, deep children read it with `useContext`.
**Here**: hold the object you need (constructor injection); no provider involved.

## 原生写法

```tsx
const ThemeContext = createContext('light');

function Deep() {
  const theme = useContext(ThemeContext);
  return <span>{theme}</span>;
}

<ThemeContext.Provider value="dark"><Deep /></ThemeContext.Provider>
```

## 对象写法

```ts
class DeepThing {
  readonly settings: Settings;   // injected by the constructor

  constructor(settings: Settings) {
    this.settings = settings;
  }

  @OopReactRender()
  view() {
    return <span>{this.settings.theme}</span>;
  }
}

// any place can do new DeepThing(app.settings)
```

## 注意

- Context solves "it does not reach"; an object just holds the reference: `this.app.settings`.
- When a real React context is needed (antd theme/locale) it is still used — a provider rendered by an island, see [complex components](../guide/complex-components.md).

## 演示

the whole demo: `t()` and the theme come from `App.settings`
