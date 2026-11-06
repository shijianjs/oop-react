---
id: render-methods
title: 渲染方法
slug: /guide/render-methods
---

一个渲染方法就是一个**岛**：它有自己的订阅，自己的错误边界，自己的重渲染范围。

## 边界在哪里

```tsx
class Panel {
  count = 0;
  note = '';

  @OopReactRender()
  view() {
    return (
      <section>
        {this.counter()}
        {this.editor()}
      </section>
    );
  }

  @OopReactRender()
  counter() {
    return <button onClick={() => this.bump()}>{this.count}</button>;
  }

  @OopReactRender()
  editor() {
    return <input value={this.note} onChange={(event) => this.setNote(event.target.value)} />;
  }

  bump(): void {
    this.count += 1;
  }

  setNote(value: string): void {
    this.note = value;
  }
}
```

- `view()` 什么都不读，所以它永远只渲染一次；
- `counter()` 读 `count`，`bump()` 之后只有它重渲染；
- `editor()` 读 `note`，输入时只有它重渲染。

`view()` 里调用 `this.counter()` 拿到的不是一个「组件标签」，而是一个已经订阅好的元素。所以嵌套没有任何
额外语法 —— 它和普通方法调用长得一模一样。

## 参数

渲染方法可以带参数，参数会原样传给方法：

```tsx
class Rows {
  items: Row[] = [];

  @OopReactRender()
  view() {
    return <ul>{this.items.map((item) => this.row(item))}</ul>;
  }

  @OopReactRender()
  row(item: Row) {
    return <li key={item.id}>{item.title}</li>;
  }
}
```

参数是那次渲染的输入，不会成为订阅的一部分。列表整体变了，`view()` 重渲染并重新调用每个 `row(item)`，
每个 `row` 各自订阅自己读到的字段。

## 渲染方法里不要写状态

渲染方法在 React 的渲染过程中执行，写状态会在渲染中再次触发失效。规则很简单：**读状态、算 JSX，
写状态放进别的方法。**

```tsx
// 不要
@OopReactRender()
view() {
  this.renders += 1;   // 写状态 → 渲染中失效
  return <p>{this.renders}</p>;
}
```

如果只是想观察「渲染了几次」，用一个普通对象计数（不进入实例，就不会被订阅）：

```tsx
const stats = {renders: 0};

@OopReactRender()
view() {
  stats.renders += 1;
  return <p>{stats.renders}</p>;
}
```

## 没有类的时候

两件函数式入口，语义和渲染方法相同。

`OopReactObserver`：把一个返回 JSX 的函数变成订阅它的岛。

```tsx
function Total() {
  return OopReactObserver(() => <strong>{cart.items.length}</strong>);
}
```

`OopReactCallback`：包一个回调，调用时返回一个岛（适合 render prop）。

```tsx
const renderRow = OopReactCallback((item: Row) => <li key={item.id}>{item.title}</li>);

function List({rows}: {rows: Row[]}) {
  return <ul>{rows.map(renderRow)}</ul>;
}
```

两者都使用 React hooks，必须在组件渲染过程中调用 —— 不能放进事件处理函数。

## 命名

每个岛的名字是 `<组件名>.<方法名>`：

- 组件名默认取类名，但生产构建会把类名压成 `zD` 之类 —— 需要人读的名字就显式给：
  `OopReactComponent(Class, 'view', {name: 'CounterView'})`；
- 这个名字同时是 React DevTools 里显示的组件名、`config.onError` 收到的第二个参数，以及 fallback 上显示的
  出处（`CounterView.list`）。见 [错误处理](./errors.md)。
