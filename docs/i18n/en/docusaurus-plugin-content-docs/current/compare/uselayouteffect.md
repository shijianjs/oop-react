---
id: uselayouteffect
title: useLayoutEffect
slug: /compare/uselayouteffect
---

**React**: run synchronously before paint, usually to measure.
**Here**: no object-side counterpart — measuring has to happen while the DOM exists and before paint, which is a component concern.

## 原生写法

```tsx
useLayoutEffect(() => {
  const {height} = ref.current.getBoundingClientRect();
  setHeight(height);
}, []);
```

## 对象写法

```ts
// objects are not part of the paint timeline; use a thin component when measuring
function Measured({onHeight}: {onHeight: (height: number) => void}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    onHeight(ref.current!.getBoundingClientRect().height);
  }, []);
  return <div ref={ref} />;
}

class Panel {
  height = 0;
  @OopReactRender()
  view() {
    return <Measured onHeight={(height) => (this.height = height)} />;
  }
}
```

## 注意

- The test is **do you need to know about paint timing**. Yes → the official hook in a thin component; no → an object method is enough.
- Writing the measurement back onto the object is still the object's job; the component only decides *when* it can be measured.

## 演示

⏳ not in the demo yet
