---
id: uselayouteffect
title: useLayoutEffect
slug: /compare/uselayouteffect
---

**React**：在浏览器绘制前同步跑，常用于测量。
**这里**：没有对象侧的对应物 —— 测量必须发生在 DOM 存在且未绘制时，那是组件的事。

## 原生写法

```tsx
useLayoutEffect(() => {
  const {height} = ref.current.getBoundingClientRect();
  setHeight(height);
}, []);
```

## 对象写法

```ts
// 对象不参与绘制时机；需要同步测量时，写一个薄组件：
function Measured({onHeight}: {onHeight: (height: number) => void}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    onHeight(ref.current!.getBoundingClientRect().height);
  }, []);
  return <div ref={ref} />;
}

// 对象把回调接进自己的字段
class Panel {
  height = 0;
  @OopReactRender()
  view() {
    return <Measured onHeight={(height) => (this.height = height)} />;
  }
}
```

## 注意

- 判断标准：**要不要知道绘制时机**。要 → 薄组件里用官方 hook；不要 → 对象方法就够了。
- 把测量结果写回对象字段仍然是对象的活，组件只负责「什么时候能测」。

## 演示

⏳ 暂无
