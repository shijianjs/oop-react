# oop-react

<p align="center">
  <img src="https://raw.githubusercontent.com/shijianjs/oop-react/main/docs/static/img/logo.png" alt="oop-react" width="96" height="96" />
</p>

**简体中文** | [English](https://github.com/shijianjs/oop-react/blob/main/packages/oop-react/README.en.md)

用面向对象的方式组织 React 的逻辑：状态和行为待在一个普通类里，`@OopReactRender()` 标出哪些方法是 UI，
其余全是普通对象代码。这些类可以在任何地方 `new`，相互持有、直接调用 —— React 只在最外层出现一次。

```tsx
import {OopReactObservable, OopReactRender} from 'oop-react';

class Cart {
  items: Item[] = [];

  constructor() {
    OopReactObservable(this);
  }

  add(item: Item): void {
    this.items.push(item);
  }

  @OopReactRender()
  view() {
    return <ul>{this.items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>;
  }
}

const cart = new Cart();

export function CartView() {
  return cart.view();
}
```

## 安装

```bash
pnpm add oop-react mobx mobx-react-lite
```

`react` / `react-dom`（`>=18.2`）、`mobx`（`^7`）与 `mobx-react-lite`（`^5`）都是 peer 依赖。追踪用 MobX，
React 绑定用官方的 `mobx-react-lite`（`observer`）。

**只跟最新大版本**：不做旧版本兼容分支。mobx 6 要配 `mobx-react-lite@4`，那是另一套 peer，这里不支持。

> **mobx 只能装一份。** 两份 mobx 各自持有自己的记账 symbol，A 造的 observable 在 B 的 reaction 里不是
> observable：状态改了界面不动，而且不报错。用 `pnpm why mobx` 检查、`pnpm dedupe` 或 `overrides` 统一版本；
> oop-react 运行时发现多份会告警。

装饰器使用旧版语义，消费方的 `tsconfig.json` 需要：

```json
{"compilerOptions": {"experimentalDecorators": true}}
```

## 它解决什么

- **状态就是字段**：`this.count += 1` 就是更新，读到的永远是当前值 —— 没有 setter、没有快照。
- **方法就是回调**：实例方法在构造器里已经绑定，`onClick={this.save}` 直接传，引用稳定，不需要 `useCallback`。
- **重渲染有边界**：一个类可以有任意多个渲染方法，每个都是独立的岛，只订阅自己读到的字段，各自被错误边界包住。
- **对象图组织逻辑**：父子孙、一对一、一对多都是直接引用，孙子可以直接写祖父的字段 —— 不需要状态提升、
  回调下传、context 或 ref。
- **可观察性在类自己手里**：构造器里 `OopReactObservable(this, {api: false})`，排除的字段名受 `keyof T`
  约束，写错是编译错误。

## API

| 导出 | 用途 |
| --- | --- |
| `OopReactRender(options?)` | 装饰器：把返回 JSX 的方法变成岛，可选 `name` / `key` |
| `OopReactObservable(instance, annotations?, options?)` | 在状态类构造器里声明可观察性（`makeAutoObservable` 的类型安全包装） |
| `OopReactObserver(render)` | 函数式入口：订阅一个返回 JSX 的函数 |
| `OopReactCallback(render)` | 函数式入口：包成 render prop |
| `OopReactBridge` | 把组件里的实例（`Form`、`message`、`modal`）交给对象，之后对象方法直接调 |
| `OopReactComponent(Class, method, options?)` | 桥：把一个类挂成 React 组件（渐进式采用时用） |
| `OopReactErrorBoundary` | 手动包一段 JSX 的错误边界 |
| `OopReactConfigure({fallback, onError, enforceActions})` | 全局的失败展示、上报与 MobX 严格模式开关 |
| `OopReactAction()` | 把一个方法显式声明成事务（多次写入一次通知） |

> **严格模式默认关闭。** 库加载时执行 `configure({enforceActions: 'never'})`：这套模型就是 `this.count += 1`，
> MobX 默认的逐条 `console.warn` 在这里全是噪音。关的是警察不是事务 —— 方法本来就是 action；要开回来用
> `OopReactConfigure({enforceActions: 'always'})`。

完整文档：[中文](https://shijianjs.github.io/oop-react/) · [English](https://shijianjs.github.io/oop-react/en/) 。
在线演示：https://shijianjs.github.io/oop-react/demo/ 。

## 依赖

追踪层是 [MobX](https://mobx.js.org/)，直接使用：`computed`、`reaction`、`toJS` 从 `mobx` import
即可，库不包装它们。库本身不依赖任何 UI 组件库。

## 许可

MIT
