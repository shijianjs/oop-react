import {defineConfig} from 'vitest/config';

/**
 * Unit tests run in jsdom because every behaviour worth pinning here is a
 * rendering behaviour: what re-renders when a field changes, what a failing
 * render method does to its neighbours, what a props change does to the
 * instance. None of that is observable without a DOM.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.tsx', 'test/**/*.test.ts'],
    restoreMocks: true,
    // Testing Library registers its DOM cleanup against these globals; without
    // them each test would find the previous test's tree still mounted.
    globals: true,
  },
});
