---
id: props
title: props 与生命周期
slug: /guide/props
---

`props` 在这个库里只做一件事：**给构造函数喂初始值**。

```tsx
class Greeting {
  name: string;

  constructor(props: {name: string}) {
    this.name = props.name;
  }

  @OopReactRender()
  view() {
    return <p>你好，{this.name}</p>;
  }
}

export const GreetingView = OopReactComponent(Greeting, 'view');
```

```tsx
<GreetingView name="世界" />
```

类型是从构造函数推出来的：`new (props: Props) => Instance` 里的 `Props` 就是组件的 props 类型。

## 实例只创建一次

组件挂载时 `new Class(props)`，之后**不会重建**。父组件重渲染、props 变化，实例都是同一个：

- 构造函数的副作用只发生一次；
- 实例字段不会被重置；
- 实例方法引用保持稳定，可以安全地作为 `onClick` 传下去。

这正是它和 `useState` 的区别：在这里，「重新渲染」不等于「重新开始」。

## props 变了怎么办

需要响应后续 props 变化时用 `onPropsChange`。它会在挂载后、以及每次 props 变化后调用：

```tsx
class Editor {
  title = '';

  sync(props: {title: string}): void {
    this.title = props.title;
  }

  @OopReactRender()
  view() {
    return <h2>{this.title}</h2>;
  }
}

export const EditorView = OopReactComponent(Editor, 'view', {
  onPropsChange: (instance, props: {title: string}) => instance.sync(props),
});
```

`onPropsChange` 接收 `(instance, props, previousProps)`。注意它是**方法调用**，改状态要落在类的方法里
（自动成为 action），不要在回调里直接给字段赋值。

## 什么时候不该用 props

`props` 是 React 树向下传值的通道，而这里对象之间可以相互持有：

```tsx
class Detail {
  constructor(readonly list: List) {}
}

class List {
  readonly detail = new Detail(this);
  readonly rows: Row[] = [];
}
```

两个对象互相调用，不需要把状态提升到共同父组件，也不需要 context、回调 prop、事件总线。只有在「这个组件
要被陌生的父组件使用」时才需要 props —— 边界清楚是好事：**组件库对外用 props，业务内部用持有**。
