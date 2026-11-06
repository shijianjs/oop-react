---
id: getting-started
title: 快速开始
slug: /getting-started
sidebar_position: 2
---

## 安装

```bash
pnpm add oop-react
```

`react` / `react-dom` / `mobx` 是 peer 依赖：`react`、`react-dom` 要求 `>=18.2`，`mobx` 接受 `^6.12 || ^7`。
**它们必须是宿主项目的依赖，而不是被装进库自己的 `node_modules`** —— 见下面的「mobx 只能有一份」。

## 打开装饰器

`@OopReactRender()` 用的是旧版装饰器语义，需要在消费方的 `tsconfig.json` 里打开：

```json title="tsconfig.json"
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

Vite、esbuild、SWC、tsc 都能转译这个组合。Babel 用户需要 `@babel/plugin-proposal-decorators` 的
`legacy: true`。

## mobx 只能有一份

追踪靠 MobX。MobX 把记账信息挂在一个**每个模块实例各自创建**的 symbol 上，所以页面里如果有两份 mobx，
A 造出来的 observable 在 B 眼里根本不是 observable —— B 的 reaction 读了它，什么都不会订阅。

症状是最难查的那种：**不报错，只是状态改了界面不动**，重新挂载一次又好像好了。

MobX 自己只在两份版本**不兼容**时告警（`There are multiple, different versions of MobX active`），
同版本的两份它不说话。所以：

- `oop-react` 把 mobx 声明为 `peerDependencies`（`^6.12 || ^7`），正常安装只有一份；
- 运行时也会检查，发现多份就打印一条 `[oop-react] N copies of mobx are loaded ...`。

排查和修复：

```bash
pnpm why mobx     # 谁装的、几个版本
pnpm dedupe       # 能合并的合并
```

合并不了（比如某个依赖锁死了旧版本）就在工作区里统一版本 —— pnpm 写在 `pnpm-workspace.yaml`：

```yaml
overrides:
  mobx: ^7.1.4
```

npm 用 `package.json` 的 `overrides`，yarn 用 `resolutions`。

## 第一个组件

一个类 + 一个渲染方法 + `OopReactComponent`：

```tsx title="counter.tsx"
import {OopReactComponent, OopReactRender} from 'oop-react';

class Counter {
  count = 0;

  increment(): void {
    this.count += 1;
  }

  @OopReactRender()
  view() {
    return (
      <button type="button" onClick={this.increment}>
        count: {this.count}
      </button>
    );
  }
}

export const CounterView = OopReactComponent(Counter, 'view');
```

`CounterView` 是一个普通 React 组件，可以直接 `<CounterView />`，也可以被任何 React 代码使用：

```tsx
function App() {
  return (
    <main>
      <CounterView />
    </main>
  );
}
```

## 它在做什么

`OopReactComponent(Counter, 'view')` 一共三件事：

1. 挂载时 `new Counter(props)` 一次，并让实例的字段可被订阅；
2. 让 `this` 上的方法都绑好，`this.increment` 可以直接当 `onClick`；
3. 渲染 `view()`，并订阅它读到的字段。

所以：**实例活得和组件一样久**，构造只跑一次，`view()` 之外的代码不会因为渲染而重跑。

## 和 React 混用

`OopReactComponent` 产出的就是普通函数组件，反过来也可以把 React 组件塞进类的 JSX：

```tsx
import {DatePicker} from 'antd';

class Filter {
  range: [string, string] | null = null;

  @OopReactRender()
  view() {
    return <DatePicker.RangePicker onChange={(value) => this.setRange(value)} />;
  }

  setRange(value: [string, string] | null): void {
    this.range = value;
  }
}
```

外部组件照常用，只是状态不放 hook 里，而是放回对象上。

下一步：[状态](./guide/state.md)。
