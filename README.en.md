# oop-react

<p align="center">
  <img src="docs/static/img/logo.png" alt="oop-react" width="96" height="96" />
</p>

[简体中文](./README.md) | **English**

State and behaviour live in a plain class. `@OopReactRender()` marks which methods are UI; everything else is
ordinary object code. Those classes can be `new`ed anywhere and hold each other — React appears once, at the edge.

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

// the only React-aware thing here
export function CartView() {
  return cart.view();
}
```

- **No `useState`, `useCallback` or dependency arrays**: a field is the state, a method is the callback (already
  bound).
- **Re-rendering has a boundary**: a class can have any number of `@OopReactRender()` methods, each an independent
  island that subscribes only to the fields it reads and carries its own error boundary.
- **Logic does not move**: objects hold each other, so a grandchild can write its grandparent's field directly —
  no context, no callback props, no refs.
- **A state class is just an object**: `new` it in a test, inject it into another class, use it without React.

- Docs: [English](https://shijianjs.github.io/oop-react/en/) · [中文](https://shijianjs.github.io/oop-react/)
- Live demo: https://shijianjs.github.io/oop-react/demo/
- npm: https://www.npmjs.com/package/oop-react

`OopReactComponent(Class, 'view')` is the **bridge** that mounts a class as a React component (incremental adoption,
or embedding the graph in an existing page) — not the main path. The main path is the two lines above.

## Repository layout

| Path | Contents |
| --- | --- |
| `packages/oop-react/` | the published npm package (Vite lib + `tsc` declarations) |
| `demo/` | Vite + React + antd demo: one object graph, one line of React |
| `docs/` | Docusaurus site (Chinese by default, English under `/en/`), deployed to GitHub Pages with the demo |

## Local development

```bash
pnpm install
pnpm demo        # demo site (http://localhost:5173)
pnpm docs        # docs site (http://localhost:3000)
pnpm test        # unit tests for the library (vitest)
pnpm typecheck   # type-check all three packages
pnpm site        # build the Pages artifact into docs/build (site at the root, demo at /demo/)
```

`SITE_BASE` sets the deployment path (default `/`, `/oop-react/` on Pages) and `SITE_URL` the origin the sitemap
advertises.

## License

MIT
