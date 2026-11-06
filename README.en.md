# oop-react

[简体中文](./README.md) | **English**

State and behaviour stay in a plain class, and only `@OopReactRender()` methods re-render.

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

No `useState`, no `useCallback`, no dependency arrays: `this.count` is the current value, `this.increment` is a
stable reference, and `view()` subscribes only to the fields it reads.

- Docs: [English](https://shijianjs.github.io/oop-react/en/) · [中文](https://shijianjs.github.io/oop-react/)
- Live demo: https://shijianjs.github.io/oop-react/demo/
- npm: https://www.npmjs.com/package/oop-react

## Repository layout

| Path | Contents |
| --- | --- |
| `packages/oop-react/` | the published npm package (Vite lib + `tsc` declarations) |
| `demo/` | Vite + React + antd demo, built into `docs/build/demo` |
| `docs/` | Docusaurus site (Chinese by default, English under `/en/`), deployed to GitHub Pages together with the demo |

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
