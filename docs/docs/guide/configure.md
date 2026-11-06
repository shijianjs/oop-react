---
id: configure
title: 替换默认实现
slug: /guide/configure
---

库的核心只有一层薄封装，四件事都是可替换的：

```ts
OopReactConfigure({
  observe,     // 怎么订阅
  observable,  // 怎么把实例变成可观察的
  fallback,    // 渲染方法抛错时显示什么
  onError,     // 错误怎么上报
});
```

它返回一个恢复函数，把自己撤掉 —— 测试里最常用：

```ts
const restore = OopReactConfigure({fallback: MyFallback});
// ……
restore();
```

## 默认实现的边界在哪

| 能力 | 默认 | 说明 |
| --- | --- | --- |
| `observe` | MobX `Reaction` | 在渲染里跑一遍渲染方法，订阅它读到的字段 |
| `observable` | `makeAutoObservable` | 字段变可观察，方法变 action 并绑定 `this` |
| `fallback` | 内置的朴素 div | 无设计系统依赖 |
| `onError` | `console.error` | |

## 换掉订阅实现

`observe` 拿到一个返回 JSX 的函数，返回渲染结果。它在一个组件内部被调用，所以可以用 hooks：

```tsx
import {useSyncExternalStore} from 'react';

OopReactConfigure({
  observe: (render) => {
    // 自己的订阅实现：只要在数据变化时让 React 重渲染即可
    return <MyObserved render={render} />;
  },
});
```

`observable` 拿到实例，返回同一个实例（可以就地加工，也可以返回包装对象，但返回什么，后续方法调用就作用在
什么上面）：

```tsx
OopReactConfigure({
  observable: (instance) => {
    // 例如：换成自己的响应式实现，或干脆什么都不做（此时渲染方法只在父级重渲染时执行）
    return instance;
  },
});
```

:::caution 不是「换个库就能用」
`observe` / `observable` 两个口子足以换掉 MobX，但换上去的实现要自己保证两件事：`observe` 里的读操作能
被追踪、`observable` 之后的写操作能触发失效。库不替你做这层适配 —— 它只规定这两个函数长什么样。
:::

## 只换一个岛

`fallback` / `onError` 是全局的。只想改一个地方，就用 `<OopReactErrorBoundary>` 手动包一层；只想给某个
组件换订阅行为，就用 `OopReactObserver` 自己写。

## 不要用它做运行时切换

`OopReactConfigure` 是模块级配置，改它对之后创建的实例和之后的渲染生效，**不会**让已经挂载的岛重新订阅。
配置在应用启动时做一次，测试里用返回值恢复。
