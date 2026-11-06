---
id: intro
title: 它解决什么
slug: /intro
sidebar_position: 1
---

React 的函数组件把「状态」和「它的持有者」拆开了：状态存在 hook 槽位里，组件函数每次渲染重新执行一遍，于是
`useCallback`、`useMemo`、依赖数组、`useRef`、闭包快照都成了必须背下来的补丁。组件的逻辑越复杂，函数越长，
抽一个子组件就要把状态往上提、把回调往下传。

oop-react 换一种组织方式：**状态和行为待在一个普通类的实例里，只有标了 `@OopReactRender()` 的方法参与重渲染**。

```tsx title="同一件事，两种写法"
// hook 版本：状态、回调、依赖都在组件函数里
function Counter() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((value) => value + 1), []);
  return <button onClick={increment}>{count}</button>;
}

// oop-react 版本：状态和回调都是实例的成员
class Counter {
  count = 0;

  increment(): void {
    this.count += 1;
  }

  @OopReactRender()
  view() {
    return <button onClick={this.increment}>{this.count}</button>;
  }
}

export const CounterView = OopReactComponent(Counter, 'view');
```

右边的类不需要 `useCallback`：`this.increment` 是实例上早就绑好的方法，引用永远不变。也不需要依赖数组：
`view()` 读了 `count`，于是 `count` 变了它就重渲染一次，别的地方一概不动。

## 三条规则

**字段就是状态。** `count = 0` 写在类里，改它就是 `this.count += 1`。没有 setter 函数，没有快照值，
读到的永远是当前值。

**方法就是行为。** 改状态的代码写在方法里，方法被按钮直接调用。逻辑待在对象上，不散落在 JSX 的箭头函数里。

**`@OopReactRender()` 就是渲染边界。** 一个类可以有任意多个渲染方法，每个都是一个独立的岛：各自订阅自己读到的
字段，各自被错误边界包住。岛可以嵌岛，粒度由你拆。

```tsx title="一个类，多个岛"
class Board {
  title = '今天的清单';
  items: string[] = [];

  @OopReactRender()
  view() {
    return (
      <section>
        {this.header()}   {/* 只有 title 变了才重渲染 */}
        {this.list()}     {/* 只有 items 变了才重渲染 */}
      </section>
    );
  }

  @OopReactRender()
  header() {
    return <h2>{this.title}</h2>;
  }

  @OopReactRender()
  list() {
    return <ul>{this.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  }
}
```

## 它放弃了什么

诚实地说清楚，比许愿有用：

- **不是「不用 React」。** 组件树、JSX、React DevTools、生态里的组件库都照旧。放弃的是「组件函数每帧重跑」
  这个组织方式，换来的是稳定的实例上下文。
- **重渲染靠细粒度订阅，默认实现是 MobX。** 不想用可以换，见
  [替换默认实现](./guide/configure.md)。
- **装饰器是旧版语义**（`experimentalDecorators`）。TypeScript 5/6/7 都支持，但要在 `tsconfig.json` 里打开。
  不想开的话，`OopReactObserver` 和 `OopReactCallback` 提供了等价的函数式入口。
- **`props` 不是主要通道。** 类与类之间是相互持有、直接调用方法；`props` 只用来给构造函数喂初始值。

下一步：[快速开始](./getting-started.md)。
