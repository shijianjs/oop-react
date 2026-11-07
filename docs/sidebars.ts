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
      // One page per official hook; collapsed so the sidebar stays readable.
      collapsed: true,
      items: [
        'compare/react-hooks',
        'compare/usestate',
        'compare/usereducer',
        'compare/usecontext',
        'compare/useref',
        'compare/useimperativehandle',
        'compare/useeffect',
        'compare/uselayouteffect',
        'compare/useinsertioneffect',
        'compare/usedebugvalue',
        'compare/usememo',
        'compare/usecallback',
        'compare/memo',
        'compare/usetransition',
        'compare/usedeferredvalue',
        'compare/useid',
        'compare/usesyncexternalstore',
        'compare/useoptimistic',
        'compare/useactionstate',
        'compare/useformstatus',
        'compare/use',
      ],
    },
    'api',
  ],
};

export default sidebars;
