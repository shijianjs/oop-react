---
id: useformstatus
title: useFormStatus
slug: /compare/useformstatus
---

**React 19**: a child component reads the pending state of the closest form submission.
**Here**: nothing to read across components — pending is a field on the form object.

## 原生写法

```tsx
function SubmitButton() {
  const {pending} = useFormStatus();
  return <button disabled={pending}>Save</button>;
}
```

## 对象写法

```ts
@OopReactRender()
footer() {
  return (
    <Button type="primary" loading={this.saving} onClick={() => this.submit()}>
      Save
    </Button>
  );
}
```

## 注意

- "The form's submission state" is a field on the object; there is no subtree restriction on who may read it.
- The button and any other island read the same `saving`, so they cannot disagree.

## 演示

Orders (`#/orders`): the dialog footer reads `saving`
