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
        'guide/state',
        'guide/render-methods',
        'guide/props',
        'guide/errors',
        'guide/configure',
      ],
    },
    'api',
  ],
};

export default sidebars;
