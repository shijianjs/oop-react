---
id: useid
title: useId
slug: /compare/useid
---

**React**: generate an SSR-safe unique id for `id`/`htmlFor`/`aria-*`.
**Here**: not wrapped. antd generates ids for form controls; for hand-written native controls call the official `useId()` inside an island.

## 原生写法

```tsx
const id = useId();
<label htmlFor={id}>Name</label>
<input id={id} />
```

## 对象写法

```ts
// antd owns the id:
<Form.Item name="customer" label="Customer"><Input /></Form.Item>

// for a native control, the id is still a component concern:
@OopReactRender()
field() {
  const id = useId();
  return <><label htmlFor={id}>Name</label><input id={id} /></>;
}
```

## 注意

- Ids are a rendering detail, not business state; keeping them on the object means managing uniqueness yourself.

## 演示

Orders (antd form)
