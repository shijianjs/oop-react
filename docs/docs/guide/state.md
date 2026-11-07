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

## 严格模式默认关闭

`oop-react` 加载时做的第一件事，是把 MobX 的 `enforceActions` 设成 `'never'`：

```ts
// 库入口自动执行，不需要你写
configure({enforceActions: 'never'});
```

理由是这套模型的写法本来就是这样：字段是状态，改它就是 `this.count += 1`。MobX 默认的严格模式会为每一次
「不在 action 里的写入」打一条 `console.warn`：

```
[MobX] Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed.
```

在这套写法里这些告警全是噪音，所以默认关掉。

**关掉的是警察，不是事务。** 方法是 action 这件事跟这个开关无关：

```ts
class Batch {
  a = 0;
  b = 0;

  both(): void {
    this.a += 1;
    this.b += 1;   // 两次写入，观察者只被通知一次
  }
}
```

要重新打开（比如团队要求「所有修改都必须显式」）：

```ts
OopReactConfigure({enforceActions: 'always'});   // 或 'observed'
```

注意 MobX 7 的违规是 `console.warn`，不是异常 —— 打开之后问题表现为控制台刷屏，而不是崩掉。

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

方法自动成为 action：一次调用里改多个字段只通知一次，等价于一段 `runInAction`。需要把一个方法**显式**声明成
事务（比如类上关掉了自动注解），就标 `@OopReactAction()`：

```ts
@OopReactAction()
reset(): void {
  this.customer = '';
  this.amount = 0;
  this.saving = false;   // 三次写入，一次渲染
}
```

:::caution 别在 JSX 里就地改字段
```tsx
<button onClick={() => (this.saving = true)}>保存</button>
```
严格模式关掉之后这行**不会告警**了，但它仍然是错的：每次写入都是一次独立通知（写三行就是三次重渲染），
而且改状态的入口散落进了 JSX。需要临时包一段就自己开事务：

```ts
runInAction(() => {
  this.saving = true;
  this.draft = null;
});
```
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

## 异步就是普通的 `async/await`

严格模式默认关着，对象方法里直接写 `async/await` 就行：

```ts
export class Cart {
  items: Item[] = [];
  saving = false;

  async save(draft: Draft): Promise<void> {
    this.saving = true;                    // 方法本身是 action
    try {
      await api.persist(draft);
      const items = await api.list();
      this.applyResult(items);             // 抽出来的方法 = 一次通知
    } finally {
      this.saving = false;                 // 单行写入，直接写没问题
    }
  }

  private applyResult(items: Item[]): void {
    this.items = items;
  }
}
```

`await` 会结束启动这个方法的那个 action，所以 `await` 之后的每次写入各自通知一次观察者 —— 大多数时候
这无所谓；确实要打包，就**把连续几行抽成一个方法**（它本身是 action），或者用 `runInAction` 包起来。
这就是这个模型里的「事务」：按需，不默认。

### 需要每一步都是事务时：`flow` 与 `yield`

MobX 的 `flow` 是 generator 写法：`yield` 等于 `await`，但每个 `yield` 之后的代码会重新进入一个 action。
这是**明确要用 `yield` 的场景**才需要的东西，普通代码不要用：

```ts
import {flow} from 'mobx';

export class Cart {
  readonly save = flow(function* (this: Cart, draft: Draft) {
    yield api.persist(draft);
    this.items = yield api.list();   // 这一步仍然在 action 里
  });
}
```

- generator **方法**也会被标成 flow，但 TS 眼里它还是 `Generator`，每个调用方得写
  `as unknown as Promise`；写成字段时类型就是运行时那个函数（`(draft) => CancellablePromise<void>`）。
- 返回 `CancellablePromise`，能 `.cancel()`；宿主打开严格模式时，`await` 之后的写入会逐条告警，
  `flow` 不受影响。

一句话：**默认 `async/await`；只有「多步流程每一步都要打包」或「要可取消」时才用 `yield` / `flow`。**

## MobX 的其它能力直接用

库不包装这些，需要就从 `mobx` 里 import：

```ts
import {autorun, reaction, toJS} from 'mobx';
```

- `reaction` / `autorun`：副作用（本地存储、埋点、同步到 URL）；
- `toJS`：把状态转成普通对象再发请求或存盘；
- `computed` / `observable` / `action` 装饰器：想更细粒度时用，和 `@OopReactRender()` 共存。

## 选项

```ts
OopReactObservable(this, {api: false}, {autoBind: false, deep: false});
```

| 选项 | 默认 | 含义 |
| --- | --- | --- |
| `autoBind` | `true` | 方法绑定到实例，`this.onClick` 是稳定引用 |
| `deep` | `true` | 嵌套对象/数组也观察；关掉后只有重新赋值才触发 |

`autoBind: false` 时方法不自动绑定：`onClick={this.save}` 会丢 `this`，要写 `onClick={() => this.save()}`。
