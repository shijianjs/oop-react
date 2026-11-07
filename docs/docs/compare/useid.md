---
id: useid
title: useId
slug: /compare/useid
---

**React**：生成 SSR 安全的唯一 id，用于 `id`/`htmlFor`/`aria-*`。
**这里**：不封装。表单控件的 id 由 antd 生成；手写原生控件时在岛里用官方 `useId()`。

## 原生写法

```tsx
const id = useId();
<label htmlFor={id}>名字</label>
<input id={id} />
```

## 对象写法

```ts
// antd 负责 id：
<Form.Item name="customer" label="客户"><Input /></Form.Item>

// 手写原生控件时，id 仍是组件的事：
@OopReactRender()
field() {
  const id = useId();
  return <><label htmlFor={id}>名字</label><input id={id} /></>;
}
```

## 注意

- id 是渲染细节，不属于业务状态；放在对象上反而要自己管唯一性。

## 演示

订单（antd 表单）
