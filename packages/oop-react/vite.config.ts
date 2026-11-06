import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

const entry = fileURLToPath(new URL('./src/index.ts', import.meta.url));

/**
 * Library build: one ESM entry, `dist/index.js`, plus the declarations that
 * `tsc -p tsconfig.build.json` emits beside it.
 *
 * Everything the library does not own stays external. React in particular must
 * never be bundled: a second copy in the consumer's graph breaks hooks, and a
 * wrapper library has no business shipping one.
 */
export default defineConfig({
  build: {
    lib: {
      entry,
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^mobx($|\/)/, /^mobx-react-lite($|\/)/],
    },
  },
});
