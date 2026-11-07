---
id: usestate
title: useState
slug: /compare/usestate
---

**React**：每个值一个 `useState`，更新靠 setter，读到的永远是这次渲染的快照。
**这里**：每个值一个字段，直接 `this.count += 1`，读到的是当前值。

## 原生写法

```tsx
const [count, setCount] = useState(0);
const [name, setName] = useState('');

<button onClick={() => setCount(count + 1)}>{count}</button>
<input value={name} onChange={(event) => setName(event.target.value)} />
```

## 对象写法

```ts
class Counter {
  count = 0;
  name = '';

  increment(): void {
    this.count += 1;
  }

  setName(value: string): void {
    this.name = value;
  }

  @OopReactRender()
  view() {
    return (
      <>
        <button onClick={this.increment}>{this.count}</button>
        <input value={this.name} onChange={(e) => this.setName(e.target.value)} />
      </>
    );
  }
}
```

## 注意

- 多个 `useState` 就是多个字段，不需要合并成一个对象；字段之间可以直接互相读，不用 effect 同步。
- 没有 setter 函数，也就没有「setter 被引用捕获到旧值」这类问题：`this.count` 永远是最新的。

## 演示

计数器（`#/counter`）
