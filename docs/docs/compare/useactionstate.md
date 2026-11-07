---
id: useactionstate
title: useActionState
slug: /compare/useactionstate
---

**React 19**：把表单提交 + 结果状态（error/pending）收进一个 action。
**这里**：对象方法 + 字段。`saving` / `error` 是字段，提交是 `async` 方法。

## 原生写法

```tsx
const [error, submit, pending] = useActionState(async (prev, formData) => {
  const result = await save(formData);
  return result.error ?? null;
}, null);
```

## 对象写法

```ts
@OopReactState
class Form {
  saving = false;
  error = '';

  async submit(values: Values): Promise<void> {
    this.saving = true;
    this.error = '';
    try {
      await this.api.save(values);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.saving = false;
    }
  }
}
```

## 注意

- `pending` 就是 `saving` 字段，`error` 就是 `error` 字段 —— 组件读它们即可，不需要第三个状态容器。
- 错误显示可以交给 antd 的 `Form.Item`/`Alert`，对象只负责「结果是什么」。

## 演示

订单（`#/orders`）：`OrderEditor.submit` 的 `saving` 与校验
