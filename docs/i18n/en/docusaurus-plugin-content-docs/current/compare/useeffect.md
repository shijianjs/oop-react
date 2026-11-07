---
id: useeffect
title: useEffect
slug: /compare/useeffect
---

**React**: run a side effect after render, controlled by the dependency array, cleaned up on unmount.
**Here**: effects belong to the object's lifetime — write them in the method that changes the state; use a `reaction` only when something really has to follow state; use `init()` from `@OopReactState` for setup.

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
    this.apply();          // the initial value needs applying too
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.apply();          // the effect happens where the change happens
  }

  private apply(): void {
    document.documentElement.dataset.theme = this.theme;
  }
}
```

## 注意

- "Most cases need no `reaction`" is right: whoever changes the state performs the effect in that method — more direct, easier to test.
- When a following effect is genuinely needed (cross-object, batched, throttled), create the `reaction` in `init()` and expose `dispose()`; never create one in a render method — that leaks one per render.
- Data fetching belongs in an `async` method (see [use](./use.md)), not in an effect.

## 演示

Settings (`App.settings`): theme and language written to `<html>`
