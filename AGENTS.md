# AGENTS.md — oop-react

本文件是**维护者**向的：这个仓库怎么组织、怎么改、有哪些必须守住的契约。包使用者要的是
`packages/oop-react/README.md` 与 `docs/` 文档站。

## 这个项目是什么

一个 React 的**组织方式**，不是 UI 框架：状态和行为待在一个普通类的实例里，只有标了 `@OopReactRender()`
的方法参与重渲染。默认的可观察性与订阅实现是 MobX，但两者都是可替换的配置项。

三个交付物，各自一个包（pnpm workspace）：

| 路径 | 包名 | 说明 |
| --- | --- | --- |
| `packages/oop-react/` | `oop-react` | 发布到 npm 的库。Vite lib 出 ESM，`tsc` 出 `.d.ts` |
| `demo/` | `@oop-react/demo` | Vite + React + antd 演示，构建产物写进 `docs/build/demo` |
| `docs/` | `@oop-react/docs` | Docusaurus 站点，文档在根路径，demo 在 `/demo/` |

GitHub Pages 只上传一个产物 `docs/build`：先建文档站，再建 demo 到它的 `demo/` 子目录。

## 命令

```bash
pnpm install
pnpm build            # 只构建库
pnpm test             # 库的 vitest（jsdom）
pnpm typecheck        # 三个包并行 tsc
pnpm demo             # demo dev server
pnpm docs             # 文档 dev server
pnpm site             # scripts/build-site.mjs：库 → 文档 → demo，产出 docs/build
```

`pnpm site` 是 Pages 产物唯一的构建入口，顺序和环境变量都在那个脚本里（`SITE_BASE` / `SITE_URL`，
默认 `/` 与 `http://localhost:3000`）；CI 只负责传 `SITE_BASE=/oop-react/`。

`demo` 与 `docs` 的 `typecheck` 也是 `tsc --noEmit`，改动后一起跑。

## 核心契约（改库之前先读）

1. **一个渲染方法 = 一个岛。** 一个订阅（只订阅它读到的字段）+ 一个错误边界。二者都必须包在**每个岛**上，
   不能上提到组件整体 —— 上提会让一次局部更新重渲染整棵子树，一次失败吃掉整页。
2. **渲染方法只读状态。** 它在 React 渲染过程中执行，写状态会在渲染中触发失效。想统计渲染次数之类的
   副作用，用不进入实例的普通对象（demo 的 `renderStats.ts` 就是例子）。
3. **改状态走方法。** 方法是 MobX 的 action，`onClick={this.save}` 不会有 `enforceActions` 告警；
   JSX 里的内联箭头直接赋值会有告警，文档里明确写了这一条，不要在库里偷偷 `configure` 全局 MobX。
4. **默认实现要能换。** `observe` / `observable` / `fallback` / `onError` 四个口子在
   `src/config/config.ts`，新增能力时先想「这是不是该成为一个口子」，而不是硬编码进组件。
5. **库不依赖 UI 组件库。** 默认 fallback 用内联样式的朴素 div；antd 只出现在 demo 和文档示例里。
6. **实例只建一次。** `OopReactComponent` 的实例活得和组件一样久，构造函数必须可重复执行但不重建；
   需要响应后续 props 就用 `onPropsChange` 调一个方法。

## 文档语言（中英双语）

文档默认中文（`docs/docs/`，路由在 `/`），英文是镜像（`docs/i18n/en/docusaurus-plugin-content-docs/current/`，
路由在 `/en/`）。**加或改一页，两边都要动**：文件名与 frontmatter 的 `id` / `slug` 必须一致，Docusaurus 靠它
把两种语言对到同一条路由上。相对链接（`./getting-started.md`）会被按 locale 解析，别写成绝对路径，否则英文页
会跳回中文。

不是 .md 的文案另有落点：

| 位置 | 文件 |
| --- | --- |
| 首页（`src/pages/index.tsx`） | `<Translate id="home.*">`，英文在 `docs/i18n/en/code.json` |
| 导航栏 / 页脚 | `docs/i18n/en/docusaurus-theme-classic/{navbar,footer}.json` |
| 侧边栏分类名 | `docs/i18n/en/docusaurus-plugin-content-docs/current.json` |

新增 `<Translate>` 之后跑一次 `pnpm --filter @oop-react/docs write-translations`，它会把新键补进
`code.json`（已有的译文保留），再手填英文。

语言切换靠导航栏的 `localeDropdown`；`docusaurus build` 一次构建两种语言（`build/` 与 `build/en/`），
本地预览英文用 `pnpm --filter @oop-react/docs start:en`（中文是 `start`）。

README 同样两份：根目录 `README.md`（中文）/ `README.en.md`，包里 `packages/oop-react/README.md`（中文）/
`README.en.md`（英文），各自顶部互相链接（包内的链接用 GitHub 绝对地址，npm 上相对路径会断）。

## 目录约定

按业务语义分目录，不按技术类型分：`src/render/`（渲染方法与函数式入口）、`src/component/`（组件工厂）、
`src/error/`（边界与默认 fallback）、`src/reactivity/`（默认可观察性实现）、`src/config/`（可替换的配置）。
新增能力一个文件夹，它的实现文件都放进去，不要为「所有类型」「所有工具」各开一层。

demo 同理：`demo/src/counter/`、`demo/src/todos/`、`demo/src/invite/`、`demo/src/failure/` 各自一个能力，
`demo/src/app/` 放外壳与共享样式。

## 已知的坑

- **装饰器是旧版语义**：`tsconfig.base.json` 里 `experimentalDecorators: true`。库自身的 `dist` 里没有装饰器
  （源码不用装饰器），消费方自己编译。
- **mobx 必须是 peerDependency，不要再挪回 dependencies。** MobX 的记账信息挂在每个模块实例自己的
  symbol 上，页面里两份 mobx 就是「状态变了界面不动」，且 MobX 只在版本不兼容时才告警（同版本静默）。
  peer 范围是 `^6.12.0 || ^7.0.0`，两个大版本都跑过测试；`src/reactivity/duplicates.ts` 负责在运行时发现
  多份并告警（`globalThis.__mobxInstanceCount`，MobX 4 起就有）。workspace 里的 `demo` 自己声明了 mobx，
  它就扮演「宿主项目」这个角色。
- **`@docusaurus/tsconfig` 仍设 `baseUrl`**，TS 6 会报 deprecated；`docs/tsconfig.json` 用
  `ignoreDeprecations: "6.0"` 静音，不要 fork 官方预设。
- **`future.v4: true` 需要 `@docusaurus/faster`**（rspack + SWC），少了它构建直接 `ERR_MODULE_NOT_FOUND`。
- **pnpm 11 用 `allowBuilds`**（不是 `onlyBuiltDependencies`）决定谁的 postinstall 能跑；`esbuild`、
  `@swc/core` 必须为 `true`，否则 Vite / Docusaurus 静默构建失败。pnpm 会自己往这个映射里追加
  `"<pkg>: set this to true or false"` 占位行，看到就填真值，别留重复键（YAML 会解析失败）。
- **docs 必须先于 demo 构建**：demo 的 `outDir` 是 `../docs/build/demo`，且 `emptyOutDir: true`；
  顺序反了 demo 会被文档站构建清掉。这就是 `scripts/build-site.mjs` 存在的理由，别再手抄这三条命令。
- **demo 的 `base`**：默认按命令决定 —— `vite` dev 是 `/`，`vite build` 是 `/oop-react/demo/`；要换站点路径用
  `DEMO_BASE` 覆盖（CI 不传，靠构建默认值，避免两处各写一遍）。
- **导航/页脚里的 demo 链接必须是绝对 URL**：`/demo/` 会被 broken-link 检查判死（构建文档时 demo 还没生成），
  而 `pathname://` 会被 locale 前缀成 `/en/demo/`（demo 没有 `/en` 版本）。所以配置里拼 `${url}${baseUrl}demo/`，
  CI 与 `pnpm site` 通过 `DOCS_URL` 提供 origin；没有 `DOCS_URL` 时指向 Vite dev server（5173）。

## 加内容时的落点

- 新增 API → `packages/oop-react/src/` 对应能力目录 + `src/index.ts` 导出 + `docs/docs/api.md` 一行 +
  单元测试（`packages/oop-react/test/`）。公开 API 一律 `OopReact` 前缀。
- 新增演示 → `demo/src/<能力>/` 一个文件夹，类 + `OopReactComponent(...)` 导出 + 挂到 `demo/src/app/App.tsx`
  的网格里；如果它演示了新的用法，文档对应页补一段。
- 新增文档页 → `docs/docs/`，同时改 `docs/sidebars.ts`；站内链接用路由路径（`/guide/state`），
  `onBrokenLinks` 是 `throw`。

## 风格

- 文本文件一律 LF。
- 注释解释「为什么」，不解释「做了什么」；面向使用者的文案用中文，代码标识符用英文。
- 不用 ESLint/Prettier：格式化靠编辑器约定（2 空格、单引号、无分号省略）。改动时跟随周围写法。
- **会产出 JSX 的模块用 `.tsx` + JSX**；`createElement` 只留给真正「拿运行时值拼元素」且本身不该是
  组件的 `.ts` 模块。别为了少一次 JSX 配置把组件写成 `createElement` 链——可读性差得多。
- 提交信息用 `feat:` / `fix:` / `docs:` / `chore:` 前缀，一次提交一件事。
