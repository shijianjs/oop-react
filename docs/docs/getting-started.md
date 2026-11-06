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

`react` / `react-dom` 是 peer 依赖，版本 `>=18.2`。

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
