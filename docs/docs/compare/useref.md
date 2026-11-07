---
id: useref
title: useRef
slug: /compare/useref
---

**React**：存一个不触发渲染的值，或者拿 DOM 节点。
**这里**：存值就是普通字段（想彻底不观察就 `@OopReactIgnore`）；拿 DOM 只在真正需要 DOM 的薄组件里用，且优先用 ref 回调把节点交给对象。

## 原生写法

```tsx
const formRef = useRef<FormInstance>(null);
const boxRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  boxRef.current?.focus();
}, []);

<div ref={boxRef} />
```

## 对象写法

```ts
@OopReactState
class Editor {
  @OopReactIgnore #form: FormInstance | null = null;   // 普通字段

  // 不需要 useEffect：React 挂载/卸载时会调这个回调
  attach = (node: HTMLDivElement | null): void => {
    node?.focus();
  };

  @OopReactRender()
  view() {
    return <div ref={this.attach} />;
  }
}
```

## 注意

- 「存一个值但不触发渲染」= 普通字段；`@OopReactIgnore` 让它连订阅都没有，子类还继承这个标记。
- 拿 DOM 时，ref 回调直接接到对象方法上，比 `useRef + useEffect` 少一层：React 调 `attach(node)` / `attach(null)`，就是挂载与卸载。
- 反应式地跑逻辑不需要 `useEffect`：数据显示在 `@OopReactRender` 方法里，由订阅驱动。

## 演示

图表（`#/chart`）—— DOM 交给对象，对象自己 init/dispose
