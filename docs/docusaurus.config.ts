import type * as Preset from '@docusaurus/preset-classic';
import type {Config} from '@docusaurus/types';
import {themes as prismThemes} from 'prism-react-renderer';

// GitHub Pages serves a project site from a sub-path, so the workflow injects
// these two; the values below are the local-development fallbacks.
const url = process.env.DOCS_URL ?? 'http://localhost:3000';
const baseUrl = process.env.DOCS_BASE_URL ?? '/';

// The demo is built into the same artifact (`docs/build/demo`), one directory
// below the site, so its URL is the site's baseUrl plus `demo/`.
//
// The `pathname://` prefix tells Docusaurus this is a real path to serve but not
// a route of its own: the demo is a separate Vite build that lands in `build/`
// after this site is built, so the broken-link checker must not judge it.
const demoHref = `pathname://${baseUrl.replace(/\/+$/, '')}/demo/`;

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

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
    localeConfigs: {
      'zh-Hans': {
        label: '简体中文',
        direction: 'ltr',
        htmlLang: 'zh-Hans',
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
