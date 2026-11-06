export const REPO = 'https://github.com/shijianjs/oop-react';

/** On GitHub Pages the demo lives under `<site>/demo/`; locally it lives at `/`. */
export const DOCS_HREF = import.meta.env.BASE_URL.replace(/demo\/$/, '');

/** Every page links back to its own source file. */
export function sourceUrl(path: string): string {
  return `${REPO}/blob/main/${path}`;
}
