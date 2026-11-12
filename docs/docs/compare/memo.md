---
id: memo
title: React.memo
slug: /compare/memo
---

**React**：包一层 `memo`，props 浅比较相等就跳过渲染。
**这里**：岛自带这层比较，而且比的是「实例 + 方法 + 名字 + 参数」，不是 props 对象本身。

## 原生写法

```tsx
const Row = memo(function Row({item, onToggle}) { … });
```

## 对象写法

```ts
@OopReactState
class Item {
  done = false;

  @OopReactRender({key: 'id'})
  row() {
    return <li>{this.title}</li>;
  }
}

// 父岛重渲染时，参数没变的 row 不会被重跑
{this.items.map((item) => item.row())}
```

## 注意

- 这就是「粒度可以无限拆碎」的前提：父岛重渲染不会沿着树把所有渲染方法重新执行一遍。
- 参数是浅比较：传入的 `item` 换了对象才重跑；只改 `item` 的字段由它自己的订阅负责。
- `OopReactObserver` / `OopReactCallback` 不享受这层（每次传入新函数），文档里写明了。

## 演示

所有页面；对照测试在库里 `isolation.test.tsx`
