---
id: useeffect
title: useEffect
slug: /compare/useeffect
---

**React**：渲染之后跑副作用，靠依赖数组控制时机，卸载时清理。
**这里**：副作用属于对象的生命周期 —— 能写在改动它的方法里就写在方法里；确实要「跟随状态」时才用 `reaction`；初始化用 `@OopReactState` 的 `init()`。

## 原生写法

```tsx
useEffect(() => {
  document.documentElement.dataset.theme = theme;
}, [theme]);
```

## 对象写法

```ts
@OopReactState
class Settings {
  theme: Theme = 'light';

  init(): void {
    this.apply();          // 初始值也要落一次
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.apply();          // 副作用发生在改动它的人身上
  }

  private apply(): void {
    document.documentElement.dataset.theme = this.theme;
  }
}
```

## 注意

- 「大多数情况不需要 `reaction`」是对的：状态是谁改的，就在那个方法里把副作用做掉，比「观察变化再响应」更直接，也更好测。
- 真的需要跟随式副作用（跨对象、批量、节流）时，在 `init()` 里建 `reaction`，并提供 `dispose()`；不要在渲染方法里建，那会每次渲染泄漏一个。
- 请求数据放 `flow` 里（见 [use](./use.md)），不要放 effect。

## 演示

设置（`App.settings`）：主题与语言写到 `<html>`
