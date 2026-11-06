#!/usr/bin/env node
import {spawnSync} from 'node:child_process';

/**
 * Builds the one artifact GitHub Pages serves: the docs site at the base path,
 * and the demo one directory below it (`<base>demo/`) inside the same output.
 *
 * Order is not a preference — the docs build empties `docs/build`, so the demo
 * has to be written into it afterwards.
 *
 * `SITE_BASE` is the deployment path (`/` locally, `/oop-react/` on Pages) and
 * `SITE_URL` the origin the sitemap advertises.
 */
const base = normalizeBase(process.env.SITE_BASE ?? '/');
const origin = process.env.SITE_URL ?? 'http://localhost:3000';

step('library', ['--filter', 'oop-react', 'build']);
step('docs site', ['--filter', '@oop-react/docs', 'build'], {
  DOCS_URL: origin,
  DOCS_BASE_URL: base,
});
step('demo', ['--filter', '@oop-react/demo', 'build'], {DEMO_BASE: `${base}demo/`});

console.log(`\nDone: docs/build is served at ${base} with the demo at ${base}demo/`);

function normalizeBase(value) {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function step(title, args, env = {}) {
  console.log(`\n› ${title}`);
  // One command string with `shell: true`: pnpm is a `.cmd` shim on Windows, and
  // Node refuses to start a `.cmd` without a shell. The arguments here are the
  // fixed words below, never user input.
  const result = spawnSync(`pnpm ${args.join(' ')}`, {
    stdio: 'inherit',
    shell: true,
    env: {...process.env, ...env},
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
