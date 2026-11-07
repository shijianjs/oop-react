---
id: usestate
title: useState
slug: /compare/usestate
---

**React**: one `useState` per value, update through a setter, and what you read is this render's snapshot.
**Here**: one field per value, `this.count += 1`, and what you read is the current value.

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

- Several `useState`s are just several fields — no need to merge them into one object, and fields can read each other without an effect.
- There is no setter to capture a stale value: `this.count` is always current.

## 演示

Counter (`#/counter`)
