---
id: structure
title: 对象图
slug: /guide/structure
---

一个应用是若干状态对象加一张「谁持有谁」的图。这张图是逻辑组织的主体，React 只是把它最外层的岛挂上去。

## 谁 new 谁

```tsx title="main.tsx —— 组装根"
import {Workshop} from './workshop/Workshop';

const workshop = new Workshop(); // 唯一一次 new 根对象

createRoot(document.getElementById('root')!).render(<WorkshopView workshop={workshop} />);
```

```tsx title="workshop/Workshop.tsx —— 根对象建它的协作者"
export class Workshop {
  readonly log: ActivityLog;
  readonly counter: CounterCard;
  readonly todos: TodoBoard;

  constructor() {
    this.log = new ActivityLog();
    this.counter = new CounterCard(this);
    this.todos = new TodoBoard(this);
    OopReactObservable(this, {
      log: false,
      counter: false,
      todos: false,
    });
  }
}
```

两条规则值得注意：

- **先建子对象，最后声明自己的可观察性**。`makeAutoObservable` 只能看到调用时已经存在的字段。
- **`false` 表示「这个字段是别人，不是我的状态」**。子对象在自己的构造器里已经声明过可观察性，父对象不该
  再深观察它一遍；剩下的字段（比如 `selected`）是父对象自己的状态，正常观察。

## 孙子直接调祖父

```tsx title="workshop/TodoItem.tsx"
export class TodoItem {
  readonly title: string;
  readonly board: TodoBoard;
  done = false;

  constructor(title: string, board: TodoBoard) {
    this.title = title;
    this.board = board;
    OopReactObservable(this, {title: false, board: false});
  }

  toggle(): void {
    this.done = !this.done;
    // 通过 board 找到祖父的 log，直接写进去
    this.board.workshop.log.add(`「${this.title}」→ ${this.done ? '已完成' : '未完成'}`);
  }

  @OopReactRender({key: (self: TodoItem) => self.title})
  row() {
    return (
      <li>
        <input type="checkbox" checked={this.done} onChange={this.toggle} />
        {this.title}
      </li>
    );
  }
}
```

勾选这一行，底部「活动日志」那张卡片会自己更新 —— 它和这条待办之间没有父子关系，也没有任何事件通道，
只是它们的字段被同一个 reaction 读了。

同样的活，React 里通常要：把回调传四层、或者建一个 context、或者 `useRef` 把父组件的 setState 塞进去。
这里就是 `this.board.workshop.log.add(...)`。

## 四种关系

| 关系 | 写法 | 例子 |
| --- | --- | --- |
| 一对一 | `readonly detail: Detail` | 选中的待办、当前用户 |
| 一对多 | `items: TodoItem[]` | 待办列表、表格的行 |
| 多对一 | 子对象持有父引用 | `readonly board: TodoBoard` |
| 跨层 | 顺着引用走 | `this.board.workshop.log` |

没有「只能向下传」的限制：孙子持有祖父、兄弟之间相互调用，都可以。

## 依赖从构造器来

```tsx
export class TodoBoard {
  readonly workshop: Workshop;

  constructor(workshop: Workshop) {
    this.workshop = workshop;
    OopReactObservable(this, {workshop: false});
  }
}
```

依赖是构造参数，测试里换成假的就行：

```ts
const workshop = {log: {add: vi.fn()}} as unknown as Workshop;
const board = new TodoBoard(workshop);
```

不要在类里 `import` 一个单例 —— 除非它真的是全局的（配置、i18n、日志后端），否则测试和复用都会变难。

## 引用成环

`Workshop` 引用 `TodoBoard`，`TodoBoard` 又引用 `Workshop`。用 `import type` 打断运行时环，类型检查不受影响：

```ts
import type {Workshop} from './Workshop';
```

## 框架层也是对象

路由、主题、语言这些「通常要装个库」的东西，在这个模型里只是图里的节点：

```tsx
export class Router {
  readonly pages: Page[];
  path: string;                       // 可观察的只有它

  constructor(pages: Page[]) {
    this.pages = pages;
    this.path = location.hash.replace(/^#\//, '') || pages[0].path;
    window.addEventListener('hashchange', () => this.sync());
    OopReactObservable(this, {pages: false});
  }

  get current(): Page {              // computed：path 变了才算
    return this.byPath(this.path);
  }
}
```

切页就是 `router.go(page)` 改一个字段，读 `router.current` 的那个岛重渲染。主题和语言同理：`Settings`
上的 `theme` / `locale`，谁读了谁订阅。演示站点的导航、深浅色、中英切换都是这么实现的，没有 router 库、
没有 i18n 库、没有 context。

## 什么时候不该这样

- **对外组件 API 用 props。** 调用方是陌生 React 代码时，props 是契约；对象图是应用内部的。
- **可能独立发布、或被别的团队使用的模块**，用接口 + props，不要要求对方把你的类 new 出来。
- **对象图在 React DevTools 里看不见。** 组件树只显示岛，业务结构要看代码或自己打日志。这是这个模型的税，
  想清楚再选。

## 对照表

| React 里你会写 | 这里 |
| --- | --- |
| `useState` | 字段 |
| `useCallback` / `useMemo` | 方法（构造器里已绑定）/ `computed` getter |
| 回调 prop 往下传 | 直接调用持有者或被持有者的方法 |
| `useContext` | 直接持有那个对象 |
| 状态提升到公共父组件 | 不提，谁需要谁持有 |
| `useRef` 存实例 | `readonly xxx = new Xxx()` |
