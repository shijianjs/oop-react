# oop-react

给 React 用的面向对象 UI 组织方式：状态和行为在一个普通类里，**只有标了 `@OopReactRender()` 的方法参与重渲染**。

```tsx
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

## 安装

```bash
pnpm add oop-react
```

`react` / `react-dom` 是 peer 依赖（`>=18.2`）。

装饰器使用旧版语义，消费方的 `tsconfig.json` 需要：

```json
{"compilerOptions": {"experimentalDecorators": true}}
```

## 它解决什么

- **状态不用外置**：字段就是状态，`this.count += 1` 就是更新，读到的永远是当前值。
- **回调不用记**：实例方法已经绑好 `this`，直接当 `onClick` 传，引用稳定，不需要 `useCallback`。
- **重渲染有边界**：一个类可以有任意多个渲染方法，每个都是独立的岛，只订阅自己读到的字段，各自被错误边界包住。
- **逻辑不用搬家**：对象之间相互持有、直接调方法，不需要状态提升、回调下传、context。

## API

| 导出 | 用途 |
| --- | --- |
| `OopReactRender()` | 装饰器：把一个返回 JSX 的方法变成岛 |
| `OopReactComponent(Class, method, options?)` | 类 + 渲染方法 → React 组件 |
| `OopReactObserver(render)` | 函数式入口：订阅一个返回 JSX 的函数 |
| `OopReactCallback(render)` | 函数式入口：包成 render prop |
| `OopReactObservable(instance, options?)` | 让组件之外创建的实例可观察 |
| `OopReactErrorBoundary` | 手动包一段 JSX 的错误边界 |
| `OopReactConfigure(patch)` | 替换订阅、可观察化、fallback、错误上报 |

完整文档：https://shijianjs.github.io/oop-react/ 。在线演示：https://shijianjs.github.io/oop-react/demo/ 。

## 默认实现

可观察性与订阅的默认实现是 [MobX](https://mobx.js.org/)（`makeAutoObservable` + `Reaction`）。不想用它，可以用
`OopReactConfigure({observe, observable})` 换掉；库本身不依赖任何 UI 组件库。

## 许可

MIT
