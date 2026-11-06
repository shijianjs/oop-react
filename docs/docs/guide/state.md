---
id: state
title: 状态
slug: /guide/state
---

状态就是实例上的字段。没有额外的 `state()`、`useState()` 或者 store 工厂。

## 字段

```tsx
class Form {
  name = '';
  tags: string[] = [];
  saving = false;
}
```

`OopReactComponent` 创建实例时会把字段变成可订阅的：读它的渲染方法订阅它，写它触发这些方法重渲染。
嵌套对象和数组也一样 —— `this.tags.push('x')` 是能触发更新的。

## 改状态写在方法里

```tsx
class Form {
  name = '';
  saving = false;

  setName(value: string): void {
    this.name = value;
  }

  async save(): Promise<void> {
    this.saving = true;
    try {
      await fetch('/api/save', {method: 'POST', body: this.name});
    } finally {
      this.saving = false;
    }
  }
}
```

方法在 `makeAutoObservable` 里自动成为 action，所以从 `onClick={this.save}` 调进去不会有任何告警。

:::caution 别在 JSX 里就地改字段
```tsx
<button onClick={() => (this.saving = true)}>保存</button>
```
这样写在开发模式下会收到 MobX 的 `enforceActions` 告警：它绕过了 action。功能仍然生效，但请改成调方法 ——
这也正是这个库想要的写法：**改状态的入口是方法，不是散落在 JSX 里的箭头函数**。
:::

## 派生值用 getter

```tsx
class Todos {
  items: {title: string; done: boolean}[] = [];
  filter: 'all' | 'done' = 'all';

  get visible() {
    return this.filter === 'all' ? this.items : this.items.filter((item) => item.done);
  }

  get remaining() {
    return this.items.filter((item) => !item.done).length;
  }
}
```

getter 是 computed：只有 `items` / `filter` 变了才重新计算，读它的渲染方法也不会因为无关字段变化而重渲染。

## 不是状态的字段

服务对象、DOM 引用、缓存不该被订阅。默认适配器把它们也变成 observable 会让调用链变得可疑（一个 service
的方法被观察没有意义），用 `observableOptions.annotations` 排除：

```tsx
const api = new ApiClient();

class Page {
  data: Row[] = [];
  readonly client = api;

  @OopReactRender()
  view() {
    return <Table rows={this.data} onReload={this.reload} />;
  }

  reload(): void {
    void this.client.fetchRows().then((rows) => {
      this.data = rows;
    });
  }
}

export const PageView = OopReactComponent(Page, 'view', {
  observableOptions: {annotations: {client: false}},
});
```

`client` 仍然能正常读、正常调用，只是对它自己的赋值和内部字段变化不再被观察。

## 共享实例

`OopReactComponent` 会为每个挂载创建新实例。要让多处共用同一个对象（跨组件的 store、父类持有的子对象），
自己建实例、调一次 `OopReactObservable`，然后在组件里用 `autoObservable: false`：

```tsx
class Cart {
  items: string[] = [];

  add(item: string): void {
    this.items.push(item);
  }
}

export const cart = OopReactObservable(new Cart());

class CartBadge {
  @OopReactRender()
  view() {
    return <span>{cart.items.length}</span>;
  }
}

export const CartBadgeView = OopReactComponent(CartBadge, 'view', {autoObservable: false});
```

`OopReactObservable` 对同一个对象调用多次是无副作用的。它不包装、不拷贝实例 —— 你手里那个对象就是被观察的那个，
`===` 比较照旧成立。

## 对象之间直接调用

```tsx
class ListPanel {
  constructor(readonly detail: DetailPanel) {}

  select(id: string): void {
    this.detail.load(id); // 直接调，不经过 prop、不经过 context
  }
}

class DetailPanel {
  id = '';

  load(id: string): void {
    this.id = id;
  }

  @OopReactRender()
  view() {
    return <div>{this.id}</div>;
  }
}
```

谁持有谁由业务决定，更新沿着方法调用走。这正是「UI 组织不渗透到代码组织」的意思：`ListPanel` 不需要知道
`DetailPanel` 怎么渲染，也不需要把自己的状态提升到它们的公共父组件里。
