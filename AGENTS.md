# AGENTS.md — oop-react

本文件是**维护者**向的：这个仓库怎么组织、怎么改、有哪些必须守住的契约。包使用者要的是
`packages/oop-react/README.md` 与 `docs/` 文档站。

## 这个项目是什么

一个 React 的**组织方式**，不是 UI 框架：状态和行为待在一个普通类的实例里，只有标了 `@OopReactRender()`
的方法参与重渲染。可观察性与订阅就是 MobX 本身，不做抽象层。

三个交付物，各自一个包（pnpm workspace）：

| 路径 | 包名 | 说明 |
| --- | --- | --- |
| `packages/oop-react/` | `oop-react` | 发布到 npm 的库。Vite lib 出 ESM，`tsc` 出 `.d.ts` |
| `demo/` | `@oop-react/demo` | Vite + React + antd 演示：一张对象图 + 五条哈希路由，产物写进 `docs/build/demo` |
| `docs/` | `@oop-react/docs` | Docusaurus 站点，文档在根路径，demo 在 `/demo/` |

GitHub Pages 只上传一个产物 `docs/build`：先建文档站，再建 demo 到它的 `demo/` 子目录。

demo 自己也是一张对象图，分层按能力目录：`app/`（根对象 `App`、`Settings`、`Feedback`）、
`routing/`（`Router`，哈希路由）、`i18n/`（中英文案字典）、`log/`、`pages/<page>/`（每页一个文件夹，
页面对象 + 它的子对象）。路由、主题、语言都是对象字段，不要为了它们引入 react-router / i18next。

`pages/orders/` 是**能力边界的试验场**：antd `Table`（受控分页/排序/选中/筛选）+ `Form`（校验、自定义
validator）+ 嵌套 `ConfigProvider` + `Form.useForm`/`Modal.useModal` 在渲染方法里 + `App.useApp()` 通过
`Feedback` 桥进入对象 + mobx `flow` 处理异步提交。改这页时先读 `docs/docs/guide/complex-components.md`，
那张表就是「什么东西放哪」的答案；没覆盖到的组件用法先加到这页，再把结论补进文档。

其余页面各自对着一种「React 里很麻烦」的场景：`pages/tictactoe/` 是官方教程 + 全部作业（快照历史、
computed 判胜、两层循环棋盘），`pages/chart/` 是命令式库（ECharts）的薄组件封装，`pages/animation/`
是 CSS 过渡与 `react-spring`（hook 关在一个岛里）。`docs/docs/compare/react-hooks.md` 那张总表把官方
hooks 逐个对到这里，加新页面时顺手把对应行填上。

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
4. **对象图是主体，`OopReactComponent` 只是桥。** 主路径是「状态类在应用入口 `new`、相互持有、普通组件
   返回 `obj.view()`」；`OopReactComponent` 只服务渐进式采用和「必须是一个组件」的场合。加新 API 前先问：
   这是不是在把对象图往组件树上搬？是就别加。
5. **绑死 mobx，不留响应式抽象层。** `config` 只有 `fallback` / `onError`；对 `makeAutoObservable` 的封装
   只提供类型和幂等（`OopReactObservable`），不要重新引入 `observe` / `observable` 口子，也不要包
   `computed` / `flow` / `reaction` —— 用户直接从 `mobx` import。
   **React 绑定用官方的 `mobx-react-lite` 的 `observer`**（`src/render/TrackedRender.tsx`），不要退回手写
   `Reaction` 循环：订阅、批处理、并发调度都该由官方实现负责。岛外面的 `memo` 是我们自己的，因为
   `observer` 的 memo 按 props 浅比较，而 `args` 每次都是新数组。
   版本策略见下面的「只跟最新大版本」——不为了 mobx 6 / lite 4 写兼容分支。
6. **可观察性用 `@OopReactState` 声明。** 类上标 `@OopReactState`，不再写构造器里的 `OopReactObservable(this)`
   （demo 里已经全部改成这样）；需要「实例可观察之后再做的事」就实现 `init()`。`OopReactObservable` 仍然公开，
   给「不能加类装饰器」的场合用（放构造器最后一行）。
   `OopReactComponent` 的 `autoObservable` 只是给「没声明过的老类」兜底。
   排除字段用 `@OopReactIgnore`（在字段旁边，子类继承），注解表仍可用且优先级更高。
   `OopReactObservable` 自己 walk 整条原型链、按 `true` 交给 MobX 的 auto 注解：这是为了绕开
   `makeAutoObservable` 的两条限制（有父类就报错、只看一层原型）。改这里时别退回 `makeAutoObservable`。
   第二次调用（子类构造器）不能传 options，MobX 会报 "Options can't be provided for already observable objects"。
7. **库不依赖 UI 组件库。** 默认 fallback 用内联样式的朴素 div；antd 只出现在 demo 和文档示例里。
8. **实例只建一次**（`OopReactComponent` 的实例活得和组件一样久），构造函数可重复执行但不重建；
   需要响应后续 props 就用 `onPropsChange` 调一个方法。

## 版本策略：只跟最新大版本

依赖范围就是当前 major，**不为旧大版本写兼容分支**：

| 依赖 | peer | 说明 |
| --- | --- | --- |
| `mobx` | `^7` | React 绑定要求它 >= 7 |
| `mobx-react-lite` | `^5` | 与 mobx 7 配套；它自己也会在运行时拒绝 mobx < 7 |
| `react` / `react-dom` | `>=18.2` | 官方绑定同时支持 18/19，这里不需要额外代码 |
| TypeScript | 仓库当前 major | 升到新 major 就整体升，不挂兼容开关 |

mobx 6 需要 `mobx-react-lite@4`，是另一套 peer；把两个范围塞进同一个包只会让依赖解析出「mobx 6 + lite 5」
这种必炸的组合。所以不支持：要么宿主升级，要么留着旧版本的旧包。升级依赖（含 dependabot 的 major）时也按这个
思路走 —— 能升到最新就升，不写「宽范围兼容」。

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

## GitHub 侧

- **Pages 由 Actions 发布**（`build_type: workflow`），不是 `gh-pages` 分支。站点地址
  https://shijianjs.github.io/oop-react/ ，demo 在 `/demo/`；首次开启用
  `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`。
- **工作流不绑 push**：`ci.yml` 只在 PR / 手动触发，`pages.yml` 只有手动触发。发布是
  `gh workflow run pages.yml`；本地验证过就可以直接提交，不必等 CI。
- **dependabot**：npm（patch/minor 合成一个 PR）+ github-actions，每周一。
- **auto-merge**：dependabot 的 PR 在检查全绿后 squash 合并。`GITHUB_TOKEN` 没有 workflows 权限，
  所以改动 `.github/workflows/` 的 PR 会被跳过、留给人工；配了 `GH_PAT` secret（contents + pull requests
  write）才会自动合。
- typescript 的大版本在 dependabot 里被忽略：`@docusaurus/tsconfig` 还设着 `baseUrl`，TS 7 已移除，
  docs 包升不上去（库本身已经在 7）。

## 已知的坑

- **装饰器是旧版语义**：`tsconfig.base.json` 里 `experimentalDecorators: true`。库自身的 `dist` 里没有装饰器
  （源码不用装饰器），消费方自己编译。
- **mobx 必须是 peerDependency，不要再挪回 dependencies。** MobX 的记账信息挂在每个模块实例自己的
  symbol 上，页面里两份 mobx 就是「状态变了界面不动」，且 MobX 只在版本不兼容时才告警（同版本静默）。
  peer 范围是 `^7`；`src/reactivity/duplicates.ts` 负责在运行时发现多份并告警
  （`globalThis.__mobxInstanceCount`，MobX 4 起就有）。workspace 里的 `demo` 自己声明了 mobx，
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
