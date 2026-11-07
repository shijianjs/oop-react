---
id: usereducer
title: useReducer
slug: /compare/usereducer
---

**React**：把「怎么改」收进一个 reducer，dispatch 动作。
**这里**：改状态的入口本来就是方法，需要一组相关动作时就让它们落在一个对象上。

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

- `useReducer` 解决的是「一个组件里动作太多」，对象里这个问题本来就不存在：动作就是一个方法。
- 需要「撤销/快照」时，重点不是 reducer，而是把状态做成不可变快照 —— 见井字棋页的历史数组。

## 演示

订单（`#/orders`）、井字棋（`#/tictactoe`）
