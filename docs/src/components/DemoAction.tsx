import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {DfkActionProps} from 'duckfn-docs-kit';

/**
 * The "Live demo" button on the home page.
 *
 * It has to reach the hero as a `dfk-action` child tag, not as a `<Link>` or a
 * bare anchor: the hero is a shadow-DOM custom element, and `duckfn-docs-kit`'s
 * `kit.css` hides every direct child of `<dfk-hero>` — anything hand-written
 * there simply never shows. The element reads its label from its text and its
 * `href` from an attribute, so the URL still has to be computed somewhere: that
 * is this component's whole job.
 *
 * The demo is a separate Vite build served from `demo/` under the site, with no
 * locale variants, so its URL comes from `docusaurus.config.ts` (it differs
 * between `docusaurus start`, where Vite serves it on its own port, and the
 * deployed site) and is carried in `customFields`.
 *
 * The import above is type-only but not decorative: `DfkActionProps` is what puts
 * `dfk-action` into React's `JSX.IntrinsicElements`, without which TypeScript
 * rejects the tag below.
 */
export default function DemoAction({children}: {children: ReactNode}): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const href = siteConfig.customFields?.demoUrl as string | undefined;
  const action: DfkActionProps = {kind: 'secondary', href, icon: 'lucide:play'};

  return <dfk-action {...action}>{children}</dfk-action>;
}
