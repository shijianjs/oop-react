import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * The "Live demo" button on the home page.
 *
 * The demo is a separate Vite build served from `demo/` under the site, with no
 * locale variants, so its URL is computed in `docusaurus.config.ts` (it differs
 * between `docusaurus start`, where Vite serves it on its own port, and the
 * deployed site) and carried in `customFields`. It has to be a plain anchor: the
 * demo is not a route this site's router owns.
 */
export default function DemoLink({children}: {children: ReactNode}): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const href = siteConfig.customFields?.demoUrl as string | undefined;

  return (
    <a className="button button--secondary button--lg" href={href}>
      {children}
    </a>
  );
}
