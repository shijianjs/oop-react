import {fileURLToPath} from 'node:url';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

const librarySource = fileURLToPath(new URL('../packages/oop-react/src/index.ts', import.meta.url));

/**
 * The demo is published at `<site>/demo/`, which on GitHub Pages means
 * `/oop-react/demo/` — a build artifact has to carry that prefix, while `vite`
 * in dev serves it from `/`. `DEMO_BASE` overrides both.
 */
export default defineConfig(({command}) => ({
  base: process.env.DEMO_BASE ?? (command === 'build' ? '/oop-react/demo/' : '/'),
  plugins: [react()],
  resolve: {
    // Same reasoning as `paths` in tsconfig.json: point the import at the source
    // so the library and the demo are one hot-reload graph.
    alias: [{find: /^oop-react$/, replacement: librarySource}],
  },
  build: {
    // Built straight into the docs site's output, which is what the Pages
    // workflow uploads: one artifact, `docs/build/`, holds the site and the demo.
    outDir: '../docs/build/demo',
    emptyOutDir: true,
  },
}));
