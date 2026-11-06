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

## 选项

```ts
OopReactObservable(this, {api: false}, {autoBind: false, deep: false});
```

| 选项 | 默认 | 含义 |
| --- | --- | --- |
| `autoBind` | `true` | 方法绑定到实例，`this.onClick` 是稳定引用 |
| `deep` | `true` | 嵌套对象/数组也观察；关掉后只有重新赋值才触发 |

`autoBind: false` 时方法不自动绑定：`onClick={this.save}` 会丢 `this`，要写 `onClick={() => this.save()}`。
