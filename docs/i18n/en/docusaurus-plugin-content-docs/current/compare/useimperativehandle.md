---
id: useimperativehandle
title: useImperativeHandle / forwardRef
slug: /compare/useimperativehandle
---

**React**: expose a component's internal methods to its parent (`forwardRef` + `useImperativeHandle`).
**Here**: the instance already belongs to an object; when the instance comes from a component, `OopReactBridge` hands it over and anyone can call it.

## 原生写法

```tsx
const Input = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({focus: () => inputRef.current?.focus()}));
  return <input ref={inputRef} />;
});

<Input ref={formRef} />
```

## 对象写法

```ts
@OopReactState
class OrderEditor {
  @OopReactIgnore #form: FormInstance<Draft> | null = null;

  bindForm(form: FormInstance<Draft> | null): void {
    this.#form = form;
  }

  @OopReactRender()
  dialog() {
    const [form] = Form.useForm<Draft>();   // the hook lives in the island
    return (
      <>
        <OopReactBridge value={form} assign={this.bindForm} />
        <Modal onOk={() => this.submit()} />
      </>
    );
  }

  async submit() { /* validateFields / resetFields are fair game */ }
}
```

## 注意

- "Let the outside call a component's methods" is the default in an object model: the instance belongs to the object, its methods are the API.
- `OopReactBridge` is the only part that has to be written: it hands a hook-provided instance to the object after commit.

## 演示

Orders (`#/orders`): the dialog form is driven by `OrderEditor`
