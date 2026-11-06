# oop-react

状态和行为留在一个普通类里，只有 `@OopReactRender()` 方法参与重渲染。

```tsx
class Counter {
  count = 0;

  increment(): void {
    this.count += 1;
  }

  @OopReactRender()
  view() {
    return <button onClick={this.increment}>{this.count}</button>;
  }
}

export const CounterView = OopReactComponent(Counter, 'view');
```

没有 `useState`，没有 `useCallback`，没有依赖数组：`this.count` 是当前值，`this.increment` 是稳定引用，
`view()` 只订阅自己读到的字段。

- 文档：https://shijianjs.github.io/oop-react/
- 在线演示：https://shijianjs.github.io/oop-react/demo/
- npm：https://www.npmjs.com/package/oop-react

## 仓库结构

| 目录 | 内容 |
| --- | --- |
| `packages/oop-react/` | 发布的 npm 库（Vite lib + `tsc` 声明） |
| `demo/` | Vite + React + antd 演示，构建产物落在 `docs/build/demo` |
| `docs/` | Docusaurus 文档站，与 demo 一起发布到 GitHub Pages |

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
