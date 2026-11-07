---
id: usecallback
title: useCallback
slug: /compare/usecallback
---

**React**：把手函数包一层，避免每次渲染都换引用（配合 `memo` 的子组件）。
**这里**：实例方法在构造时就绑定好了，引用天然稳定 —— 不需要 `useCallback`。

## 原生写法

```tsx
const save = useCallback(() => {
  dispatch({type: 'save'});
}, []);
```

## 对象写法

```ts
@OopReactState
class Form {
  save(): void {
    // this 已经绑定
  }

  @OopReactRender()
  view() {
    return <Button onClick={this.save}>保存</Button>;
  }
}
```

## 注意

- `autoBind` 默认开着；关掉（`OopReactObservable(this, {}, {autoBind: false})`）时才需要 `() => this.save()`。
- 「引用稳定」也因此自动成立：岛是 memo 的，参数没变就不重跑。

## 演示

全站（`onClick={this.bump}` 之类）
