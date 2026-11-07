---
id: usereducer
title: useReducer
slug: /compare/usereducer
---

**React**: put "how it changes" into a reducer and dispatch actions.
**Here**: changing state is already a method; a group of related actions simply lives on one object.

## 原生写法

```tsx
function reducer(state, action) {
  switch (action.type) {
    case 'add': return {items: [...state.items, action.item]};
    case 'remove': return {items: state.items.filter((i) => i !== action.item)};
    default: return state;
  }
}

const [state, dispatch] = useReducer(reducer, {items: []});
```

## 对象写法

```ts
class Cart {
  items: Item[] = [];

  add(item: Item): void {
    this.items.push(item);
  }

  remove(item: Item): void {
    this.items = this.items.filter((candidate) => candidate !== item);
  }
}
```

## 注意

- `useReducer` exists because one component gathers too many transitions; an object does not have that problem — an action is a method.
- For undo/snapshots the reducer is not the point: keep immutable snapshots, as the tic-tac-toe history does.

## 演示

Orders (`#/orders`), tic-tac-toe (`#/tictactoe`)
