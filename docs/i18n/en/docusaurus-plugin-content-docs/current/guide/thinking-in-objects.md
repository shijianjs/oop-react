---
id: thinking-in-objects
title: Thinking in objects
slug: /guide/thinking-in-objects
---

A parallel version of React's [Thinking in React](https://react.dev/learn/thinking-in-react): the same searchable
product table, the same five steps, only each step asks "which objects?" instead of "which components?".

Read the two side by side. The order is the same; what changes is what you are holding at the end of each step —
there a component tree and a pile of props, here an object graph and a few render methods.

## Start from the mockup and the data

The mockup: a search field, an "only show products in stock" checkbox, and a table grouped by category
(name + price, out-of-stock names in red). The data is still the official one:

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

When the JSON is shaped well, the UI and the data model tend to have the same shape — true on both sides.
What differs is where the data lands: in React it becomes some component's `props`, here it becomes a field on an
object.

## Step 1: break it into objects, not components

You still draw boxes on the mockup and name them; each box now answers two questions:

| Question | Yes | No |
| --- | --- | --- |
| Does it have **state** of its own that changes? | an object (or at least a field) | a render method is enough |
| Does it need to read or write **someone else**? | hold a reference to that object | hold nothing |

The five official boxes become:

| Box on the mockup | React | Here |
| --- | --- | --- |
| the whole app | `FilterableProductTable` | the `CatalogPage` object |
| the search bar | `SearchBar` | the `SearchBar` object |
| the table | `ProductTable` | the `ProductTable` object |
| a category row | `ProductCategoryRow` | a render method on `ProductTable` |
| a product row | `ProductRow` | `ProductTable.row(product)`, with a key |

**Two boxes deliberately did not become objects.** They have no state of their own and are too small to deserve a
file; a render method is already the smallest unit:

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

In React the hierarchy ("who is inside whom") decides who re-renders with whom and how data flows. Here it only
decides who calls whom:

```
CatalogPage
├─ products       a readonly reference: data from the API, nobody changes it
├─ filterText     field
├─ inStockOnly    field
├─ searchBar      SearchBar (holds the page)
└─ table          ProductTable (holds the page)
```

## Step 2: build the static version

React's rule for the static version is "props only, no state"; its counterpart here is "render methods read fields
and never write them":

```tsx title="catalog/CatalogPage.tsx"
export interface Product {
  readonly category: string;
  readonly price: string;
  readonly stocked: boolean;
  readonly name: string;
}

@OopReactState
export class CatalogPage {
  /** A readonly reference: the API gave us this data and nobody changes it, so it is not state. */
  @OopReactIgnore readonly products: Product[];
  /** Interaction is not wired up yet: these two are just initial values for now. */
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

Note `new SearchBar(this)`: the only "passing down" in this model, and it passes **an object to an object**, not data
to data. The search bar receives the page and reads whatever it needs later — so one-way data flow shrinks to a
single constructor call.

(Top-down and bottom-up both work. Methods naturally run top-down, so top-down is easier; row methods can come
later.)

The static version hits the same trap as in React: `value={this.page.filterText}` with no `onChange` makes the input
read-only and the console warns `You provided a value prop to a form field without an onChange handler`. That is the
reminder that interaction is not wired yet — Step 5 fixes it.

## Step 3: find the minimal but complete state

React's three questions, one for one:

| Question | React | Here |
| --- | --- | --- |
| 1. Does it stay unchanged over time? | not state | not a field: a readonly reference (`products`) |
| 2. Is it passed in from a parent? | not state | not a field: another object already holds it, reference that |
| 3. Can it be computed from existing state / props? | definitely not state | not a field: a `get` accessor (computed) |

Run the four pieces of data through it:

| Data | Verdict |
| --- | --- |
| the original product list | unchanged → `@OopReactIgnore readonly products` |
| the search text | changes, cannot be derived → **a field** |
| the checkbox | changes, cannot be derived → **a field** |
| the filtered list | derivable → **a computed getter** |

```ts
get visible(): Product[] {
  const text = this.filterText.trim().toLowerCase();
  return this.products.filter((product) => {
    const matchesText = text === '' || product.name.toLowerCase().includes(text);
    return matchesText && (!this.inStockOnly || product.stocked);
  });
}
```

Storing `visible` as a field would mean re-syncing it in every setter — that is "a copy of state", just moved from
React into an object. MobX caches a computed for you: the island that reads it recomputes only after `filterText` /
`inStockOnly` change, or `products` is reassigned.

Grouping by category is a purely visual derivation: neither a field nor an object. A plain function that never
enters the graph is enough:

```ts
/** A pure function: no state, so nothing to subscribe to. */
export function groupByCategory(products: Product[]): {category: string; products: Product[]}[] { … }
```

### A step deeper: what props and state become

| | React | Here |
| --- | --- | --- |
| read-only data from outside | props | constructor arguments, or another object you hold |
| something you own and change | state (`useState`) | a field plus the methods that change it |
| who may change it | only the parent (through a setter) | only this object's methods; others call them |
| what gets passed down | values + callbacks | references (the other side reads and calls) |

In React both props and state "belong to some component". Here the two split cleanly: **a reference is a
relationship, a field is ownership**.

## Step 4: who do these fields belong to

React looks for the closest common parent component, because data can only travel along the component tree. There is
no such channel here: two consumers need not know each other, they only need to hold the owner. So the question
changes from "which component" to:

> Whose state is this, semantically?

Both filter conditions are about "what this page is looking at", not about the search field:

- `CatalogPage` holds `filterText` / `inStockOnly` and changes them through `setFilterText` / `setInStockOnly`;
- `SearchBar` reads and writes them, and stores nothing itself;
- `ProductTable` only writes `this.page.visible`; nothing else to wire.

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

The opposite case matters just as much: a field that belongs only to the input (say "is the advanced filter
expanded") should live on `SearchBar`, and the page should not know about it. **The test is not "who uses it" but
"whose thing is it".**

React's third option — if no parent fits, create one — becomes: **create an object** that everyone who needs it
holds. For instance, lift the filter into a `CatalogFilter` the day the orders page wants to reuse the same
`matches(product)`.

## Step 5: inverse data flow — there is no "inverse" here

In React data flows down as props, so user input has to travel back up: the parent passes setters down and the child
calls them in `onChange`. It is called "inverse" because the component tree has exactly one channel.

An object graph has no such channel, so nothing to invert. Wiring up `onChange` is the whole step:

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

`SearchBar` already holds the page, so it calls the page's methods; the table does not change at all — it reads
`page.visible`, and re-renders on its own when a field moves. No callback chain, no event bus, no context, no
"pass the setter down four levels".

Writes are still one-way: only `CatalogPage`'s methods can change those two fields. That is discipline, not
something the language enforces — break it and "who changed this value" is lost. It is also the price of this model:
React DevTools shows a component tree, not an object graph.

One detail that must hold: `onChange` is an event, not a render. Write fields from event handlers or plain methods,
never inside `view()` (see [render methods](./render-methods.md)).

## After the five steps

| React's step | Here |
| --- | --- |
| break the UI into a component hierarchy | break it into objects: state or responsibility earns an object, pure display is a render method |
| static version with props only | render methods read fields; events not wired |
| three questions to find state | three questions to find fields; anything derivable is computed |
| lift state to the closest common parent | put state on the object it belongs to; consumers hold a reference |
| pass setters down as callbacks | call the method |

Only two fields actually change in this example, so the graph is small: one page object plus two children. Another
screen looks different — the demo's orders page keeps table state, a form instance and a dialog flag on objects, and
the log shared across pages is a field on `App`, see [the object graph](./structure.md).

Keep reading: [state](./state.md) · [render methods](./render-methods.md) ·
[complex components and hooks](./complex-components.md)

## When not to think this way

- **A published component API uses props.** When the caller is unfamiliar React code, props are the contract; an
  object graph is for the inside of an application.
- **Reusing a piece of UI inside somebody else's React tree** is a plain component, or a
  [component bridge](./react-bridge.md).
- **A page with a single field** should not grow three classes to have "an object graph". The lesson here is to cut
  by state and responsibility, not by box.
