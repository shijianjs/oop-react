---
id: useref
title: useRef
slug: /compare/useref
---

**React**: keep a value without re-rendering, or grab a DOM node.
**Here**: a value is just a field (mark it `@OopReactIgnore` to keep it out of observation); the DOM is only touched in a thin component, preferably by handing the node to an object through a ref callback.

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
  @OopReactIgnore #form: FormInstance | null = null;   // a plain field

  // no useEffect needed: React calls this on mount and unmount
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

- "A value that must not re-render" is just a field; `@OopReactIgnore` removes even the subscription, and subclasses inherit the mark.
- For the DOM, a ref callback wired to an object method is one layer less than `useRef + useEffect`: React calls `attach(node)` and `attach(null)` — mount and unmount.
- Reactive work needs no `useEffect` at all: the display lives in a `@OopReactRender` method and the subscription drives it.

## 演示

Chart (`#/chart`) — the DOM node is handed to the object, which inits and disposes the instance
