---
id: state
title: 状态
slug: /guide/state
---

状态就是实例上的字段，可观察性由类自己在构造器里声明。

## 在构造器里声明

```tsx title="cart.ts"
import {OopReactObservable} from 'oop-react';

export class Cart {
  readonly api = new ApiClient();
  items: Item[] = [];
  saving = false;

  constructor() {
    OopReactObservable(this, {api: false});
  }
}
```

- 每个字段变成可观察的，每个方法变成 action 并绑定到实例；
- 第二个参数排除「不是状态」的字段：服务、DOM 节点、缓存、以及别的已经自己声明过可观察性的状态对象；
- 类型是 `{readonly [K in keyof Cart]?: Annotation}` —— **写错字段名是编译错误**，改名后忘了改这里也会被
  编译器抓住。这是包里对 `makeAutoObservable(this, {...})` 唯一做的事（外加幂等），其余全部是 MobX 原样。

:::caution 放在构造器最后
`makeAutoObservable` 只能看到调用时已经存在的字段。所有字段都在构造器之前（声明处）或构造器里先赋值，再调用它。
:::

## 用 `@OopReactIgnore` 排除字段

注解表是「除了这几个，其它都是状态」，字段一多就变成一张待维护的清单。把标记放到字段旁边更好读：

```ts
class Cart {
  @OopReactIgnore readonly api = new ApiClient();
  @OopReactIgnore readonly board: Board;
  items: Item[] = [];

  constructor() {
    OopReactObservable(this);
  }
}
```

- 被标记的字段保持普通字段：不建 observable、不参与订阅；子类继承这个标记；
- 需要一次性覆盖时，注解表仍然可用，且**优先级更高**：`OopReactObservable(this, {items: false})`。

## 继承：父类也一起标注

`makeAutoObservable` 遇到有父类的类会直接报错（`can only be used for classes that don't have a superclass`），
而且只看得到自己这一层原型。`OopReactObservable` 走完**整条原型链**，并且允许子类再调一次：

```ts
class Base {
  @OopReactIgnore readonly service = new ApiClient();
  count = 0;

  constructor() {
    OopReactObservable(this);
  }

  get doubled() {
    return this.count * 2;      // computed
  }

  bump(): void {
    this.count += 1;            // action.bound
  }
}

class Derived extends Base {
  extra = 0;

  constructor() {
    super();
    OopReactObservable(this);   // 只补 extra，父类已经标注过的不重复
  }
}
```

父类的 getter 是 computed、父类的方法是 action、父类标的 `@OopReactIgnore` 照样生效。

## 改状态写在方法里

```ts
export class Cart {
  items: Item[] = [];

  add(item: Item): void {
    this.items.push(item);
  }

  async checkout(): Promise<void> {
    this.saving = true;
    try {
      await this.api.pay(this.items);
    } finally {
      this.saving = false;
    }
  }
}
```

方法自动成为 action，`onClick={this.add}` 不会有 `enforceActions` 告警。

:::caution 别在 JSX 里就地改字段
```tsx
<button onClick={() => (this.saving = true)}>保存</button>
```
这样绕过 action，开发模式下会收到 MobX 的告警。写法上也不对：改状态的入口是方法。
:::

## 派生值用 getter

```ts
export class Todos {
  items: {title: string; done: boolean}[] = [];

  get visible() {
    return this.items.filter((item) => !item.done);
  }
}
```

getter 是 computed：只在依赖变化时重算，读它的岛也不会因为无关字段而重渲染。

## 嵌套状态对象

父对象持有另一个状态对象时，标 `false`：那个对象自己会声明可观察性，父对象再深观察一遍没有意义。

```ts
export class Workshop {
  readonly todos: TodoBoard;
  selected: TodoItem | null = null;

  constructor() {
    this.todos = new TodoBoard(this);
    // todos 是自己管自己的对象；selected 是本对象的状态，正常观察
    OopReactObservable(this, {todos: false});
  }
}
```

`selected` 不标 `false`，因为它确实要触发重渲染 —— 这就是「注解只影响可观察性，不改变字段语义」。

## MobX 的其它能力直接用

库不包装这些，需要就从 `mobx` 里 import：

```ts
import {autorun, flow, reaction, toJS} from 'mobx';
```

- `flow` / `flowResult`：异步动作，适合多步表单；
- `reaction` / `autorun`：副作用（本地存储、埋点、同步到 URL）；
- `toJS`：把状态转成普通对象再发请求或存盘；
- `computed` / `observable` / `action` 装饰器：想更细粒度时用，和 `@OopReactRender()` 共存。

`flow` 建议写成**字段**而不是 generator 方法：

```ts
export class Cart {
  readonly save = flow(function* (this: Cart, draft: Draft) {
    yield api.persist(draft);
    this.items = yield api.list();
  });
}
```

`makeAutoObservable` 会把 `*save()` 这样的 generator 方法也变成 flow，但 TypeScript 仍然把它当 `Generator`，
每个调用方都得 `as unknown as Promise`。写成字段时，它的类型就是运行时那个函数：`(draft) => CancellablePromise<void>`。

**为什么不用 `async/await`。** 因为 MobX 的 action 边界在 `await` 处就断了：`async` 方法整体是一个 action，
但 `await` 之后的代码已经不在 action 里，写被观察的字段会被严格模式拦下 ——

```
[MobX] Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed.
```

`flow` 每 `yield` 之后重新进入一次 action，所以多步流程（`loading = true` → 请求 → 写结果 → 收尾）每一步都合法。
`await` 之后不写被观察的状态、或者用 `runInAction` 把写入包起来，用 `async` 也完全可以。

## 选项

```ts
OopReactObservable(this, {api: false}, {autoBind: false, deep: false});
```

| 选项 | 默认 | 含义 |
| --- | --- | --- |
| `autoBind` | `true` | 方法绑定到实例，`this.onClick` 是稳定引用 |
| `deep` | `true` | 嵌套对象/数组也观察；关掉后只有重新赋值才触发 |

`autoBind: false` 时方法不自动绑定：`onClick={this.save}` 会丢 `this`，要写 `onClick={() => this.save()}`。
