---
id: intro
title: 它解决什么
slug: /intro
sidebar_position: 1
---

React 把状态放在组件函数里：组件函数每帧重跑一遍，于是 `useCallback`、`useMemo`、依赖数组、`useRef`、
闭包快照成了必须背下来的补丁；逻辑一复杂，函数就变长，抽个子组件还要把状态往上提、回调往下传。

oop-react 换的是**逻辑的组织方式**，不是 JSX 的写法：状态和行为待在一个普通类里，用 `@OopReactRender()`
标出「哪些方法是 UI」，其余全是普通对象代码。这些类可以在任何地方 `new`，相互持有、直接调用 —— React 只在
最外层出现一次。

```tsx title="一张对象图，一行 React"
class Cart {
  items: Item[] = [];

  constructor() {
    OopReactObservable(this);
  }

  add(item: Item): void {
    this.items.push(item);
  }

  @OopReactRender()
  view() {
    return <ul>{this.items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>;
  }
}

const cart = new Cart();

// 唯一和 React 有关的东西
export function CartView() {
  return cart.view();
}
```

`cart` 在模块里 `new` 出来，测试里直接 `new Cart()` 断言，别的地方要它就直接持有 —— 它不依赖 React，
也不依赖某个组件是否挂载。

## 三条规则

**对象图组织逻辑。** 谁持有谁由业务决定：祖父可以直接被孙子持有，一对多就是数组。更新沿着方法调用走，
不需要把状态提到公共父组件，也不需要 context、回调 prop、事件总线或 ref。

**`@OopReactRender()` 是渲染边界。** 一个类可以有任意多个这样的方法，每个都是一个**岛**：只订阅自己读到的
字段，各自被一个错误边界包住。岛可以嵌岛，粒度自己拆。

**React 只在边界上。** 普通函数组件返回 `root.view()` 就够了。只有当「这个类必须作为一个组件被别人的
React 代码使用」时，才需要 [`OopReactComponent`](./guide/react-bridge.md) —— 渐进式采用、或把对象图嵌进
已有的 React 页面。

## 它放弃了什么

- **绑定 MobX。** 追踪靠 MobX，库不提供「换成别的响应式实现」的口子 —— 换掉的成本约等于自己造一个 MobX。
  `makeAutoObservable`、`computed`、`reaction` 都是直接用，见[状态](./guide/state.md)。
- **装饰器是旧版语义**（`experimentalDecorators`）。不想开的话，`OopReactObserver` 和 `OopReactCallback`
  是等价的函数入口。
- **`props` 不是主要通道。** 对象之间相互持有，`props` 只用来给构造函数喂初始值、以及和外部 React 代码交接。
- **不是「一个组件一个类」。** 类不是组件的替身，它是逻辑的容器；一个类可以有十几个岛，一个岛也可以不挂在
  任何组件上。

下一步：[快速开始](./getting-started.md)，然后看[对象图](./guide/structure.md)。
