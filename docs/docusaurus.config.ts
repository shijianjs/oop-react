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

const config: Config = {
  title: 'oop-react',
  tagline: '状态留在对象里，重渲染留在注解里',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url,
  baseUrl,
  trailingSlash: true,
  onBrokenLinks: 'throw',

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
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      hideOnScroll: true,
      title: 'oop-react',
      logo: {
        alt: 'oop-react',
        src: 'img/logo.svg',
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
