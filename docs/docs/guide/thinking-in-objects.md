---
id: thinking-in-objects
title: 用对象的方式思考 React
slug: /guide/thinking-in-objects
---

这一页是 react.dev 的 [Thinking in React](https://react.dev/learn/thinking-in-react) 的平行版本：同一个可搜索的
商品表格，同样的五步，只是每一步的问题从「拆成哪些组件」换成「拆成哪些对象」。

两页对着读最有效果。顺序没变，变的是每一步之后你手里拿到的东西：那边是一棵组件树加一堆 props，
这边是一张对象图加几个渲染方法。

## 先有设计稿和数据

设计稿：一个搜索框、一个「只看有货」复选框、一张按类别分组的表（名称 + 价格，缺货的名字标红）。
数据还是官方那份：

```json
[
  {"category": "Fruits", "price": "$1", "stocked": true, "name": "Apple"},
  {"category": "Fruits", "price": "$1", "stocked": true, "name": "Dragonfruit"},
  {"category": "Fruits", "price": "$2", "stocked": false, "name": "Passionfruit"},
  {"category": "Vegetables", "price": "$2", "stocked": true, "name": "Spinach"},
  {"category": "Vegetables", "price": "$4", "stocked": false, "name": "Pumpkin"},
  {"category": "Vegetables", "price": "$1", "stocked": true, "name": "Peas"}
]
```

JSON 结构干净的时候，UI 和数据模型往往同形 —— 这一点两边一样。区别在于这份数据后面落到哪：
React 里它成为某个组件的 `props`，这里它成为一个对象的字段。

## 第 1 步：拆的不是组件，是对象

仍然在设计稿上画框、命名，只是每个框回答两个问题：

| 问题 | 是 | 否 |
| --- | --- | --- |
| 它自己有会变的**状态**吗？ | 一个对象（至少是字段） | 一个渲染方法就够了 |
| 它需要读或者写**别人**吗？ | 持有那个对象的引用 | 不需要持有 |

官方的五个框在这里变成：

| 设计稿上的框 | React | 这里 |
| --- | --- | --- |
| 整个应用 | `FilterableProductTable` | `CatalogPage` 对象 |
| 搜索框 | `SearchBar` | `SearchBar` 对象 |
| 表格 | `ProductTable` | `ProductTable` 对象 |
| 类别行 | `ProductCategoryRow` | `ProductTable` 上的一个渲染方法 |
| 商品行 | `ProductRow` | `ProductTable.row(product)`，带 key |

**有两个框没变成对象，是故意的。** 它们没有自己的状态，也小到不值得一个文件；一个渲染方法已经是最小单位：

```tsx title="catalog/ProductTable.tsx"
@OopReactRender({key: (_self: ProductTable, product: Product) => product.name})
row(product: Product) {
  const {name, price, stocked} = product;

  return (
    <tr>
      <td>{stocked ? name : <span className="out-of-stock">{name}</span>}</td>
      <td>{price}</td>
    </tr>
  );
}
```

层级（谁在谁里面）在 React 里决定「谁跟着谁重渲染」和「数据怎么流」；在这里它只决定「谁调用谁」：

```
CatalogPage
├─ products       只读引用：API 给的数据，没人会改
├─ filterText     字段
├─ inStockOnly    字段
├─ searchBar      SearchBar（持有 page）
└─ table          ProductTable（持有 page）
```

## 第 2 步：先搭静态版

React 的静态版规则是「只传 props、不用 state」；这里的对应物是「渲染方法只读字段、不写字段」：

```tsx title="catalog/CatalogPage.tsx"
export interface Product {
  readonly category: string;
  readonly price: string;
  readonly stocked: boolean;
  readonly name: string;
}

@OopReactState
export class CatalogPage {
  /** 只读引用：这是 API 给的数据，没人改它，所以它不是状态。 */
  @OopReactIgnore readonly products: Product[];
  /** 交互还没接：两个筛选条件先只是初始值。 */
  filterText = '';
  inStockOnly = false;
  @OopReactIgnore readonly searchBar: SearchBar;
  @OopReactIgnore readonly table: ProductTable;

  constructor(products: Product[]) {
    this.products = products;
    this.searchBar = new SearchBar(this);
    this.table = new ProductTable(this);
  }

  @OopReactRender()
  view() {
    return (
      <div className="catalog">
        {this.searchBar.view()}
        {this.table.view()}
      </div>
    );
  }
}
```

注意 `new SearchBar(this)`：这是这个模型里唯一的「传参」，而且是**对象传对象**，不是数据传数据。
SearchBar 拿到页面本身，以后要什么自己去读 —— 所以「单向数据流」在这里只剩一次构造器调用。

（自顶向下、自底向上都能写。方法天然是从上往下调的，所以自顶向下更顺手；行方法可以后面补。）

静态版会踩到和 React 一样的坑：`value={this.page.filterText}` 却没有 `onChange`，输入框是只读的，
控制台会警告 `You provided a value prop to a form field without an onChange handler`。这正是「交互还没接」的
提醒，第 5 步补上。

## 第 3 步：找出最小但完整的「状态」

React 的三个问题，一一对应过来：

| 问题 | React | 这里 |
| --- | --- | --- |
| 1. 它随时间不变吗？ | 不是 state | 不是字段：只读引用（`products`） |
| 2. 它由父组件传进来吗？ | 不是 state | 不是字段：别的对象已经持有它，引用过去 |
| 3. 它由已有的 state / props 算得出来吗？ | 绝对不是 state | 不是字段：`get` 访问器（computed） |

四块数据过一遍：

| 数据 | 结论 |
| --- | --- |
| 原始商品列表 | 不变 → `@OopReactIgnore readonly products` |
| 搜索文本 | 会变、算不出来 → **字段** |
| 复选框 | 会变、算不出来 → **字段** |
| 过滤后的列表 | 算得出来 → **computed getter** |

```ts
get visible(): Product[] {
  const text = this.filterText.trim().toLowerCase();
  return this.products.filter((product) => {
    const matchesText = text === '' || product.name.toLowerCase().includes(text);
    return matchesText && (!this.inStockOnly || product.stocked);
  });
}
```

`visible` 如果存成字段，就得在每个 setter 里同步一次 —— 那就是「复制一份 state」，只是从 React 挪到了对象里。
MobX 的 computed 会自己缓存，读它的岛只在 `filterText` / `inStockOnly` / 改动 `products` 之后才重算。

按类别分组是纯展示派生，既不该是字段，也不该是对象 —— 一个不进对象图的普通函数就够：

```ts
/** 纯函数：没有状态，也就不需要订阅任何东西。 */
export function groupByCategory(products: Product[]): {category: string; products: Product[]}[] { … }
```

### 深入一步：props 和 state 在这里分别是什么

| | React | 这里 |
| --- | --- | --- |
| 从外面来的只读数据 | props | 构造参数，或者持有的另一个对象 |
| 自己会变、自己负责 | state（`useState`） | 字段 + 改它的方法 |
| 谁能改 | 只有父组件（通过 setter 回传） | 只有这个对象的方法，别人只能调方法 |
| 传下去的形态 | 值 + 回调 | 引用（对方自己读、自己调） |

React 里 props 和 state 都「属于某个组件」；在这里两者分得很干净：**引用是关系，字段是所有权**。

## 第 4 步：这些字段属于谁

React 要找一个「最近的共同父组件」，因为数据只能沿组件树上下走。这里没有这条通道：两个消费者不必认识彼此，
只要都持有状态的所有者。所以问题从「放哪个组件」变成：

> 这份状态在语义上属于谁？

两个筛选条件属于「这个页面在看什么」，不属于搜索框：

- `CatalogPage` 持有 `filterText` / `inStockOnly`，并用 `setFilterText` / `setInStockOnly` 改它们；
- `SearchBar` 读它、写它，但自己什么都不存；
- `ProductTable` 只写 `this.page.visible`，别的都不用接。

```tsx title="catalog/SearchBar.tsx"
@OopReactState
export class SearchBar {
  @OopReactIgnore readonly page: CatalogPage;

  constructor(page: CatalogPage) {
    this.page = page;
  }

  @OopReactRender()
  view() {
    return (
      <form className="search-bar" onSubmit={(event) => event.preventDefault()}>
        <input value={this.page.filterText} placeholder="Search…" />
        <label>
          <input type="checkbox" checked={this.page.inStockOnly} /> Only show products in stock
        </label>
      </form>
    );
  }
}
```

反过来的情况一样重要：如果某个字段只属于输入框自己（比如「高级筛选是否展开」），它就该待在 `SearchBar` 上，
页面不需要知道。**判断标准不是「谁用到」，而是「这东西是谁的」。**

React 的第三种选项 —— 找不到合适的父组件就造一个 —— 在这里是：**造一个对象**，让需要它的几个对象都持有它。
比如把筛选条件抽成 `CatalogFilter`，订单页也复用同一套 `matches(product)` 的时候。

## 第 5 步：反向数据流 —— 这边没有「反向」

React 里数据靠 props 向下流，用户输入要反向走：父组件把 setter 传下去，子组件在 `onChange` 里调它。之所以叫
「反向」，是因为组件树只有一条通道。

对象图里没有这条通道，也就没有「反向」。补上 `onChange` 就完事了：

```tsx
<input
  value={this.page.filterText}
  onChange={(event) => this.page.setFilterText(event.target.value)}
/>
<input
  type="checkbox"
  checked={this.page.inStockOnly}
  onChange={(event) => this.page.setInStockOnly(event.target.checked)}
/>
```

SearchBar 已经持有 `page`，直接调页面上的方法；表格那边一行不用改，它读的是 `page.visible`，
字段一变自己就重渲染。没有回调链、没有事件总线、没有 context，也没有「把 setter 传四层」。

写入仍然是单向的：只有 `CatalogPage` 的方法改得了那两个字段。这条是纪律，不是语法强制的 —— 破了它，
「这个值是谁改的」就散了。这也是这个模型要付的代价：React DevTools 里看得见组件树，看不见对象图。

还有一个必须守住的细节：`onChange` 是事件，不是渲染。改字段只能发生在事件处理里或普通方法里，
绝不能写在 `view()` 里（见[渲染方法](./render-methods.md)）。

## 五步之后

| React 的步子 | 这里的步子 |
| --- | --- |
| 拆组件层级 | 拆对象：有状态或职责才成对象，纯展示用渲染方法 |
| 静态版只用 props | 渲染方法只读字段，先不接事件 |
| 三个问题找 state | 三个问题找字段，算得出来的一律 computed |
| state 提到最近公共父组件 | 状态放到语义上属于它的对象上，消费者持引用 |
| setter 当回调往下传 | 直接调方法 |

这个例子里真正会变的只有两个字段，所以图很小：一个页面对象加两个子对象。换个页面就不一样 —— 演示里的
订单页把表格状态、表单实例、弹窗开合都放在对象上，跨页共享的日志是 `App` 的字段，见[对象图](./structure.md)。

继续看：[状态](./state.md) · [渲染方法](./render-methods.md) · [复杂组件与 hooks](./complex-components.md)

## 什么时候别这么想

- **对外发布的组件 API 用 props。** 调用方是陌生的 React 代码时，props 是契约；对象图是应用内部的。
- **要在别人的 React 树里复用一块 UI**，就写普通组件，或用一个[组件桥](./react-bridge.md)。
- **只有一个字段的页面**别为了「有对象图」造三个类。这一页的教训是按状态和职责切，不是按框切。
