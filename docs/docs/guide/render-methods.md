---
id: render-methods
title: 渲染方法
slug: /guide/render-methods
---

一个渲染方法是一个**岛**：自己的订阅、自己的错误边界、自己的重渲染范围。

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
    return <button onClick={this.bump}>count: {this.count}</button>;
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

- `view()` 什么都不读，所以只渲染一次；
- `counter()` 读 `count`，`bump()` 只重渲染它；
- `editor()` 读 `note`，输入时只重渲染它。

`view()` 里写 `this.counter()` 拿到的不是组件标签，而是已经订阅好的元素 —— 嵌套不需要任何额外语法。

## 父岛重渲染不会重跑子岛

岛是 memo 的，比较的是「实例 + 方法 + 名字 + 调用参数」。所以父岛因为自己的字段变化而重渲染时，
参数没变的子岛会被跳过 —— 它自己的字段变了才重跑。

这就是「粒度可以无限拆碎」成立的前提：React 默认会重渲染整棵子树，没有这层 memo，父岛一次状态变化
就会把下面所有渲染方法重新执行一遍。参数是**浅比较**的，所以 `this.row(item)` 里 `item` 换了对象才会重跑；
只改 `item` 的字段不会（那由 `row()` 自己的订阅负责）。

`OopReactObserver` / `OopReactCallback` 不享受这条：它们传进去的是每次渲染新生成的函数，没有可比的东西，
所以父级重渲染时会跟着重跑。要这块也隔离，就把它写成带注解的方法。

## 包装组件

想写一个「像 `div` / `Card` 那样」的包装组件 —— 外壳提供轮廓和语义，里面完全自定义 —— 不需要 `children`：
让外壳对象持有一个**内容对象**，内容自己是一个岛。

```tsx title="demo/src/pages/frame/Frame.tsx"
export interface FrameContent {
  view(): ReactNode;
}

class Frame {
  tone: 'plain' | 'danger' = 'plain';   // 轮廓语义：外壳自己的字段
  collapsed = false;
  body: FrameContent;                   // 内容：另一个对象

  @OopReactRender()
  view() {
    return (
      <section className={`frame frame--${this.tone}`}>
        <header>{/* 标题栏、收合按钮 */}</header>
        {this.collapsed ? null : this.body.view()}
      </section>
    );
  }
}
```

三个要点：

- **内容是类型，不是节点。** 任何有 `view()` 的对象都能塞进去：一段文字、一个计数器、一张表格，或者另一个
  `Frame`（嵌套就是这么来的）。外壳不知道里面是什么，也不需要知道。
- **两半各订阅各的。** `tone` / `collapsed` 变了重渲染的是外壳，`this.body.view()` 的参数没变，内容岛被跳过；
  反过来，内容里的字段变了只重跑内容岛。
- **换内容是赋值。** `frame.body = other` 就够了，不必为每种内容写一个包装组件，外壳实例也不用重建。

演示里的「包装组件」页就是几个 `Frame` 实例：换 `tone`、换 `body`、三层嵌套，以及一个没有标题于是只剩轮廓的
（同一个类，去掉标题就是 `div`）。

## 在哪里画

岛的元素是普通 React 元素，创建它没有副作用，所以哪里都能画：

```tsx
// 普通组件里
export function PanelView() {
  return panel.view();
}

// 另一个对象的渲染方法里
@OopReactRender()
view() {
  return <main>{this.panel.view()}</main>;
}

// 列表里
@OopReactRender()
list() {
  return <ul>{this.items.map((item) => item.row())}</ul>;
}
```

但是**不要在事件处理函数里调用渲染方法**：它返回的是要交给 React 渲染的元素，不是"执行一次渲染"的命令。

## 列表与 key

岛的元素由装饰器创建，调用方手里没有元素可以挂 `key`，所以 key 写在装饰器上。**大多数情况就是自己身上一个
字段**，给字段名就行（想看类型检查就带上类名）：

```tsx
@OopReactRender({key: 'id'})
row() {
  return <li>{this.title}</li>;
}

@OopReactRender<TodoItem>({key: 'id'})   // 字段名对不上会报错
```

身份要从几个字段凑出来时，别写函数，写个 `get` —— 它本来就是这一行自己的事：

```tsx
class TodoItem {
  get key(): string {
    return `${this.board.id}-${this.title}`;
  }

  @OopReactRender({key: 'key'})
  row() {
    return <li>{this.title}</li>;
  }
}
```

函数形式只剩一种场合：**父对象代子对象渲染**，身份来自调用参数，`this` 上没有这个东西。

```tsx
@OopReactRender({key: (_self: TodoBoard, item: TodoItem) => item.id})
row(item: TodoItem) {
  return <li>{item.title}</li>;
}
```

更彻底的做法是让子对象自己渲染自己（`item.row()` 配 `{key: 'id'}`）—— 那样连函数都不用写。

## 起名

岛的名字是 `<类名>.<方法名>`，出现在 React DevTools、fallback 和 `onError` 的第二个参数里。生产构建会把类名
压成 `AD`，所以给人看的地方显式命名：

```tsx
@OopReactRender({name: 'FlakySection'})   // → FlakySection.content
content() { … }
```

`OopReactComponent(Class, 'view', {name: 'CounterView'})` 会给这个类的所有岛统一前缀。

## 渲染方法里不要写状态

渲染方法在 React 的渲染过程中执行，写状态会在渲染中再次触发失效。规则：**读状态、算 JSX，写状态放进别的方法。**

```tsx
// 不要
@OopReactRender()
view() {
  this.renders += 1;   // 渲染中写状态
  return <p>{this.renders}</p>;
}
```

只想统计渲染次数就用普通对象（不进实例，所以不会被订阅）：

```ts
const stats = {renders: 0};

@OopReactRender()
view() {
  stats.renders += 1;
  return <p>{stats.renders}</p>;
}
```

## 没有类的时候

`OopReactObserver`：把一个返回 JSX 的函数变成订阅它的岛。

```tsx
function Total() {
  return OopReactObserver(() => <strong>{cart.items.length}</strong>);
}
```

`OopReactCallback`：包成「调用时返回岛」的回调，适合 render prop。

```tsx
const renderRow = OopReactCallback((item: Item) => <li key={item.id}>{item.title}</li>);

function List({items}: {items: Item[]}) {
  return <ul>{items.map(renderRow)}</ul>;
}
```

两者都使用 hooks，必须在组件渲染过程中调用 —— 不能放进事件处理函数。

渲染方法本身也可以调用 hook（它就是一个组件）；provider、`Form.useForm`、`App.useApp` 这类边界怎么处理，
见[复杂组件与 hooks](./complex-components.md)。
