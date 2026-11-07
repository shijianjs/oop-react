---
id: useimperativehandle
title: useImperativeHandle / forwardRef
slug: /compare/useimperativehandle
---

**React**：把组件内部的方法暴露给父组件（`forwardRef` + `useImperativeHandle`）。
**这里**：实例本来就归对象所有，需要时用 `OopReactBridge` 把组件里的实例交给对象，谁都能调。

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
    const [form] = Form.useForm<Draft>();   // 岛里拿实例
    return (
      <>
        <OopReactBridge value={form} assign={this.bindForm} />
        <Modal onOk={() => this.submit()} />
      </>
    );
  }

  async submit() { /* validateFields / resetFields 都能调 */ }
}
```

## 注意

- 「让外面能调组件内部的方法」在对象模型里是默认能力：实例归对象，方法就是 API。
- `OopReactBridge` 是唯一需要写的地方：把 hook 提供的实例在 commit 之后交给对象。

## 演示

订单（`#/orders`）：弹窗表单由 `OrderEditor` 驱动
