---
id: useformstatus
title: useFormStatus
slug: /compare/useformstatus
---

**React 19**：子组件读「最近一次表单提交」的 pending 状态。
**这里**：不需要跨组件读 —— pending 就是表单对象上的字段，谁要读谁读。

## 原生写法

```tsx
function SubmitButton() {
  const {pending} = useFormStatus();
  return <button disabled={pending}>保存</button>;
}
```

## 对象写法

```ts
@OopReactRender()
footer() {
  return (
    <Button type="primary" loading={this.saving} onClick={() => this.submit()}>
      保存
    </Button>
  );
}
```

## 注意

- 「表单的提交状态」在对象上是一个字段，没有「只在某个子树里才读得到」的限制。
- 按钮和表单的其他岛同时读 `saving`，天然一致。

## 演示

订单（`#/orders`）：弹窗底部按钮读 `saving`
