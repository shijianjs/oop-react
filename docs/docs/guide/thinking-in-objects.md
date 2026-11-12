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
React 里它成为某个组件的 `props`，这里它在入口处映射成对象，之后就没有「裸数据」了。

## 第 1 步：拆的不是组件，是对象

仍然在设计稿上画框、命名。**每个框都是一份职责，也就是一个类** —— 后面四步都建立在这个判断上。

| 设计稿上的框 | React | 这里 |
| --- | --- | --- |
| 整个应用 | `FilterableProductTable` | `CatalogPage` |
| 搜索框 | `SearchBar` | `SearchBar` |
| 表格 | `ProductTable` | `ProductTable` |
| 类别行 | `ProductCategoryRow` | `Category` |
| 商品行 | `ProductRow` | `Product` |

商品行最容易被省掉：「不就是 `map` 里一行 JSX 吗，写成 `table.row(product)` 还少一个文件。」省掉的是 `this`：

```tsx title="catalog/Product.tsx"
export class Product {
  constructor(
    readonly category: string,
    readonly price: string,
    readonly stocked: boolean,
    readonly name: string,
  ) {}

  @OopReactRender({key: (self: Product) => self.name})
  row() {
    return (
      <tr>
        <td className={this.stocked ? undefined : 'out-of-stock'}>{this.name}</td>
        <td>{this.price}</td>
      </tr>
    );
  }
}
```

换成父对象上的 `row(product)`，第一行大概就是 `const {name, price, stocked} = product;` —— 声明一点没少写，
拿到的却只是三个只能读的局部变量。`this` 不是可以随手抵消的语法糖，它是这一行自己的上下文：以后要 hover
状态、要「选中」、要被别的地方调 `row.select()`，都写在这上面。**上下文丢了，能力就没了。**

`Product` 没标 `@OopReactState`：它的字段不会变，不需要可观察。装饰器只跟「会变的状态」有关，跟「能不能画」
无关；后面四个类里也只有 `CatalogPage` 有状态。

层级（谁在谁里面）在 React 里决定「谁跟着谁重渲染」和「数据怎么流」；在这里它只决定「谁调用谁」：

```
CatalogPage
├─ products       只读引用：API 数据，Product 对象
├─ filterText     字段
├─ inStockOnly    字段
├─ categories     Category[]，构造时分组一次
├─ searchBar      SearchBar（持有 page）
└─ table          ProductTable（持有 page）
```

## 第 2 步：先搭静态版

React 的静态版规则是「只传 props、不用 state」；这里的对应物是「渲染方法只读字段、不写字段」：

```tsx title="catalog/CatalogPage.tsx"
@OopReactState
export class CatalogPage {
  /** 只读引用：这是 API 给的数据，没人改它，所以它不是状态。 */
  @OopReactIgnore readonly products: Product[];
  /** 交互还没接：两个筛选条件先只是初始值。 */
  filterText = '';
  inStockOnly = false;
  @OopReactIgnore readonly categories: Category[];
  @OopReactIgnore readonly searchBar: SearchBar;
  @OopReactIgnore readonly table: ProductTable;

  constructor(products: Product[]) {
    this.products = products;
    // 分组只跟数据有关，数据不会变，所以算一次就够。
    this.categories = [...new Set(products.map((product) => product.category))].map(
      (category) => new Category(this, category),
    );
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
SearchBar 拿到页面本身，以后要什么自己去读 —— 连「流」都谈不上：构造器递一次引用，之后全是直接调用。

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

`visible` 如果存成字段，就得在每个写入点同步一次 —— 那就是「复制一份 state」，只是从 React 挪到了对象里。
MobX 的 computed 会自己缓存，读它的岛只在 `filterText` / `inStockOnly` 变了之后才重算。

这也给出了两条规则：**不会变的，在构造器里算一次**（`categories`）；**会变的，放在 `get` 里算**（`visible`）。
两者都不该是字段。

### 深入一步：props 和 state 在这里分别是什么

| | React | 这里 |
| --- | --- | --- |
| 从外面来的只读数据 | props | 构造参数，或者持有的另一个对象 |
| 自己会变、自己负责 | state（`useState`） | 字段 |
| 谁能改 | 只有父组件（通过 setter） | 任何持有它的对象，写字段或调方法都行 |
| 传下去的形态 | 值 + 回调 | 引用（对方自己读、自己调） |

React 里 props 和 state 都「属于某个组件」；在这里两者分得很干净：**引用是关系，字段是所有权**。
所有权是设计问题（谁负责这个值），不是门禁 —— 写起来就是赋值，没人拦你。

## 第 4 步：这些字段属于谁

React 要找一个「最近的共同父组件」，因为数据只能沿组件树上下走。这里不需要通道：两个消费者不必认识彼此，
只要都持有状态的所有者。所以问题从「放哪个组件」变成：

> 这份状态在语义上属于谁？

两个筛选条件属于「这个页面在看什么」，不属于搜索框：

- `CatalogPage` 持有 `filterText` / `inStockOnly`；
- `SearchBar` 读它、写它，自己什么都不存；
- `Category` 和 `ProductTable` 读 `page.visible`，别的都不用接。

```tsx title="catalog/SearchBar.tsx"
export class SearchBar {
  constructor(readonly page: CatalogPage) {}

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

另一个读者：类别行只知道自己叫什么，剩下的去问页面。

```tsx title="catalog/Category.tsx"
export class Category {
  constructor(
    readonly page: CatalogPage,
    readonly name: string,
  ) {}

  @OopReactRender()
  row() {
    // visible 是 computed：筛选条件一变，这个岛自己重渲染，商品行不会被连带重跑。
    const visible = this.page.visible.filter(
      (product) => product.category === this.name,
    );
    if (visible.length === 0) return null;

    return (
      <>
        <tr>
          <th colSpan={2}>{this.name}</th>
        </tr>
        {visible.map((product) => product.row())}
      </>
    );
  }
}
```

反过来的情况一样重要：如果某个字段只属于输入框自己（比如「高级筛选是否展开」），它就该待在 `SearchBar` 上，
页面不需要知道。**判断标准不是「谁用到」，而是「这东西是谁的」。**

React 的第三种选项 —— 找不到合适的父组件就造一个 —— 在这里是：**造一个对象**，让需要它的几个对象都持有它。
比如把筛选条件抽成 `CatalogFilter`，订单页也复用同一套 `matches(product)` 的时候。

## 第 5 步：没有「方向」这回事

React 里数据只能沿组件树朝一个方向走，于是它给两个方向各起了一个名字：往下叫「数据流」，往上叫「反向数据流」。
这不是两个功能，是同一条单行道的正反两面 —— 想让上层改一个值，就得把 setter 一节一节递下去，中间每一层都要
接住它、再往下传（或者造一个 context 把它藏起来）。

这里没有单行道，也就没有方向可言。谁持有谁，就能读、能写、能调方法；`SearchBar` 改 `page.filterText`，
和页面改自己的字段是同一个动作，既不是「向上」也不是「向下」：

```tsx
<input
  value={this.page.filterText}
  onChange={(event) => {
    this.page.filterText = event.target.value;
  }}
/>
<input
  type="checkbox"
  checked={this.page.inStockOnly}
  onChange={(event) => {
    this.page.inStockOnly = event.target.checked;
  }}
/>
```

写字段和调方法没有区别。方法只是「顺手把几件事捆在一起」的容器 —— 演示里那些 `setXxx` 会同时记一条日志，
所以值得包一层；这里没有别的事要做，直接赋值就完了。为了「统一入口」硬造一个 `setFilterText` 属于脱裤子放屁。

表格那边一行不用改：`Category` 读的是 `page.visible`，字段一变它自己重渲染；`Product.row()` 没有参数、
也没读到筛选字段，于是被跳过。没有回调接力、没有事件总线、没有 context。

唯一真正不能破的是：**别在渲染方法里写字段**。渲染正在读、你同时写，就是渲染中触发失效
（见[渲染方法](./render-methods.md)）。写字段要发生在事件处理里或普通方法里。

## 五步之后

| React 的步子 | 这里的步子 |
| --- | --- |
| 拆组件层级 | 拆对象：每个框一个类；只有会变的状态才需要 `@OopReactState` |
| 静态版只用 props | 渲染方法只读字段，先不接事件 |
| 三个问题找 state | 三个问题找字段，算得出来的一律 computed |
| state 提到最近公共父组件 | 状态放到语义上属于它的对象上，消费者持引用 |
| setter 当回调往下传 | 没有方向：持有它的对象直接读写，或者调一个顺手的方法 |

这个例子里真正会变的只有两个字段，所以图很小：一个页面对象加四个子对象（`Product` 是数据，`Category` 是
分组，`SearchBar` 是输入，`ProductTable` 是外壳）。换个页面就不一样 —— 演示里的订单页把表格状态、表单实例、
弹窗开合都放在对象上，跨页共享的日志是 `App` 的字段，见[对象图](./structure.md)。

继续看：[状态](./state.md) · [渲染方法](./render-methods.md) · [复杂组件与 hooks](./complex-components.md)

## 什么时候别这么想

- **对外发布的组件 API 用 props。** 调用方是陌生的 React 代码时，props 是契约；对象图是应用内部的。
- **要在别人的 React 树里复用一块 UI**，就写普通组件，或用一个[组件桥](./react-bridge.md)。
- **不是框的东西就别拆成类。** 分组、格式化、校验这类没有上下文的计算，普通函数比对象合适 —— 它们不需要
  `this`，也就不该占一个类的位置。这一页的教训是按框拆、按职责拆，不是把函数包一层壳。
