# oop-react

<p align="center">
  <img src="docs/static/img/logo.png" alt="oop-react" width="96" height="96" />
</p>

**简体中文** | [English](./README.en.md)

状态和行为待在一个普通类里，`@OopReactRender()` 标出哪些方法是 UI，其余全是普通对象代码。这些类可以在任何
地方 `new`，相互持有、直接调用 —— React 只在最外层出现一次。

```tsx
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

// 唯一和 React 有关的东西
export function CartView() {
  return cart.view();
}
```

- **没有 `useState` / `useCallback` / 依赖数组**：字段就是状态，方法就是回调（已经绑定好）。
- **重渲染有边界**：一个类可以有任意多个 `@OopReactRender()` 方法，每个都是独立的岛，只订阅自己读到的字段，
  各自被一个错误边界包住。
- **逻辑不搬家**：对象之间相互持有，孙子可以直接写祖父的字段，不经过 context、回调 prop 或 ref。
- **状态类本身就是普通对象**：可以在测试里 `new`，可以被别的类注入，可以脱离 React 单独使用。

- 文档：[中文](https://shijianjs.github.io/oop-react/) · [English](https://shijianjs.github.io/oop-react/en/)
- 在线演示：https://shijianjs.github.io/oop-react/demo/
- npm：https://www.npmjs.com/package/oop-react

`OopReactComponent(Class, 'view')` 是把一个类挂成 React 组件的**桥**（渐进式采用、或塞进已有 React 页面），
不是主路径 —— 主路径就是上面那两行。

## 仓库结构

| 目录 | 内容 |
| --- | --- |
| `packages/oop-react/` | 发布的 npm 库（Vite lib + `tsc` 声明） |
| `demo/` | Vite + React + antd 演示：一张对象图，一行 React |
| `docs/` | Docusaurus 文档站（中文默认、英文在 `/en/`），与 demo 一起发布到 GitHub Pages |

## 本地开发

```bash
pnpm install
pnpm demo        # 演示站点（http://localhost:5173）
pnpm docs        # 文档站点（http://localhost:3000）
pnpm test        # 库的单元测试（vitest）
pnpm typecheck   # 三个包一起类型检查
pnpm site        # 构建 Pages 产物到 docs/build（站点在根，演示在 /demo/）
```

`SITE_BASE` 决定部署路径（默认 `/`，Pages 上是 `/oop-react/`），`SITE_URL` 决定 sitemap 里的站点地址。

## 许可

MIT
