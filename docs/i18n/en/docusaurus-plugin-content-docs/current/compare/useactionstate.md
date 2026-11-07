---
id: useactionstate
title: useActionState
slug: /compare/useactionstate
---

**React 19**: fold form submission and its result state (error/pending) into one action.
**Here**: an object method plus fields — `saving` / `error` are fields, submitting is a `flow`.

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

  *submit(values: Values): Generator<Promise<unknown>, void, unknown> {
    this.saving = true;
    this.error = '';
    try {
      yield this.api.save(values);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.saving = false;
    }
  }
}
```

## 注意

- `pending` is the `saving` field and `error` is the `error` field — the component reads them; no third state container.
- Displaying the error is antd's job (`Form.Item` / `Alert`); the object only owns the outcome.

## 演示

Orders (`#/orders`): `saving` and validation in `OrderEditor.submit`
