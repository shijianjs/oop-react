import {remarkMermaid} from 'duckfn-docs-kit/mermaid/remark';
import {dfkExtensions} from 'duckfn-docs-kit/sql/extensions';
import {dfkTocToggle} from 'duckfn-docs-kit/toc-toggle/plugin';
import type * as Preset from '@docusaurus/preset-classic';
import type {Config} from '@docusaurus/types';
import {themes as prismThemes} from 'prism-react-renderer';

// GitHub Pages serves a project site from a sub-path, so the workflow injects
// these two; the values below are the local-development fallbacks.
const url = process.env.DOCS_URL ?? 'http://localhost:3000';
const baseUrl = process.env.DOCS_BASE_URL ?? '/';

// The demo is a separate Vite build that lands in `docs/build/demo`, below the
// site. It has no locale variants — `/demo/` is the only one — so the link is an
// absolute URL: an absolute one is neither prefixed with `/en` nor guessed at by
// the broken-link checker (the directory does not exist yet when this site is
// built, the demo is written afterwards).
//
// `DOCS_URL` is set by CI and by `pnpm site`; without it we are under
// `docusaurus start`, where the demo runs on Vite's own dev server.
const demoHref =
  process.env.DOCS_URL === undefined
    ? 'http://localhost:5173/'
    : new URL(`.${baseUrl}demo/`, `${url}/`).href;

// Mermaid's look and palette come from the kit's own default
// (`DEFAULT_MERMAID_CONFIG`): mermaid's `neo` chrome with the redux palette —
// `redux-color` in light mode, `redux-dark-color` in dark. Keeping that default
// rather than restating it here is what keeps this site's diagrams identical to
// every other duckfn-family docs site, and means a palette change lands by
// upgrading the kit instead of by editing this file.
//
// A site that wants its own colours passes
// `remarkMermaid({config: {theme: {light, dark}, options: {look}}})` instead.
// A value mermaid does not recognise is ignored *silently*, so such a change is
// verified in a browser, never by a build.

const config: Config = {
  title: 'oop-react',
  tagline: '状态留在对象里，重渲染留在注解里',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url,
  baseUrl,
  trailingSlash: true,
  onBrokenLinks: 'throw',

  // The home page's "Live demo" button reads this: `demoHref` is an absolute
  // URL, and an MDX page cannot compute it.
  customFields: {
    demoUrl: demoHref,
  },

  // Chinese is the default: it is served from `/`, English from `/en/`. The
  // navbar dropdown is what makes the two reachable from each other.
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
    localeConfigs: {
      'zh-Hans': {
        label: '简体中文',
        direction: 'ltr',
        htmlLang: 'zh-Hans',
      },
      en: {
        label: 'English',
        direction: 'ltr',
        htmlLang: 'en',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          // Docs live at the site root (`/intro`, `/api`), with the custom home
          // page owning `/`. Shorter URLs for a site that is mostly docs.
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/shijianjs/oop-react/tree/main/docs/',
          // The one remark plugin this site needs: a ```mermaid fence
          // becomes a `<dfk-mermaid>` element (from `duckfn-docs-kit`) that
          // renders the diagram in the browser — mermaid is a lazy `import()`,
          // so a page without a diagram never downloads it. It replaces
          // `@docusaurus/theme-mermaid` and `markdown.mermaid` entirely: this
          // site has neither, and two renderers on one page would fight.
          //
          // No options: the palette and the `neo` chrome are the kit's default
          // (see the note above), and passing nothing writes no `config`
          // attribute, so every diagram falls back to it.
          remarkPlugins: [remarkMermaid],
        },
        // The home page is a *page*, not a doc: it is compiled by the pages
        // plugin, so it needs the mermaid plugin listed again to draw the
        // diagram in its showcase section.
        pages: {
          remarkPlugins: [remarkMermaid],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // The docs-kit wiring. `dfkExtensions` injects the kit's client bootstrap on
  // every page, and that is what defines the `dfk-*` custom elements: a docs
  // page never imports the kit's React tree, so without it a ```mermaid fence
  // would sit in the page as an inert `<dfk-mermaid>`. Its `preload` list is
  // empty on purpose — this site has no runnable SQL blocks, so there is no
  // DuckDB extension to fetch at build time or to load at run time.
  //
  // `dfkTocToggle` adds the collapse control to the right-hand table of
  // contents (Docusaurus has no `hideable` option for it, only for the left
  // sidebar) and remembers the choice in `localStorage`.
  plugins: [dfkExtensions(), dfkTocToggle()],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      hideOnScroll: true,
      title: 'oop-react',
      logo: {
        alt: 'oop-react',
        src: 'img/logo.png',
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guide',
          position: 'left',
          label: '文档',
        },
        {
          href: demoHref,
          position: 'left',
          label: '演示',
        },
        {
          href: 'https://github.com/shijianjs/oop-react',
          position: 'right',
          label: 'GitHub',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {label: '它解决什么', to: '/intro'},
            {label: '快速开始', to: '/getting-started'},
            {label: 'API', to: '/api'},
          ],
        },
        {
          title: '其它',
          items: [
            {label: '在线演示', href: demoHref},
            {label: 'GitHub', href: 'https://github.com/shijianjs/oop-react'},
            {label: 'npm', href: 'https://www.npmjs.com/package/oop-react'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} shijianjs. MIT licensed.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
