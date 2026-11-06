---
id: configure
title: 全局配置
slug: /guide/configure
---

可以配的只有两件：失败的岛长什么样、错误报到哪里去。

```ts
OopReactConfigure({
  fallback,  // 渲染方法抛错时显示什么
  onError,   // 错误怎么上报
});
```

它返回一个恢复函数，把自己撤掉 —— 测试里最常用：

```ts
const restore = OopReactConfigure({onError: vi.fn()});
// ……
restore();
```

## 为什么没有「换掉响应式实现」的口子

被认真考虑过，结论是不做。MobX 的价值不在 `makeAutoObservable` 这一行，而在 `computed` 失效传播、批量事务、
`flow`、`reaction`、`toJS`、调试工具这一整套。换掉它的工作量约等于自己造一个 MobX，而在中间塞一层适配层只会
让两边都变形。

所以：

- 状态类在自己的构造器里声明可观察性（`OopReactObservable`），这是 MobX 的地方；
- 库只负责「把渲染方法放进一个 `Reaction` 里跑，读到的字段就订阅」；
- 想要 MobX 的其它能力，直接从 `mobx` import，没有中间层。

## 配置是模块级的

`OopReactConfigure` 影响之后创建的实例和之后的渲染，**不会**让已经挂载的岛重新订阅。在应用启动时配一次，
测试里用返回值恢复。

只改一个地方就不必动全局配置：

- 某个岛要用别的错误展示 → 手动包一层 `<OopReactErrorBoundary>`；
- 一段手写 JSX 要订阅 → 用 `OopReactObserver`。
