import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guide: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: '指南',
      collapsed: false,
      items: [
        'guide/structure',
        'guide/state',
        'guide/render-methods',
        'guide/complex-components',
        'guide/react-bridge',
        'guide/errors',
        'guide/configure',
      ],
    },
    {
      type: 'category',
      label: 'React 写法对照',
      collapsed: false,
      items: ['compare/react-hooks'],
    },
    'api',
  ],
};

export default sidebars;
