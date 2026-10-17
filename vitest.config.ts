import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The calculator registry uses import.meta.glob; Vitest's on-disk module cache
    // doesn't notice newly added calculator files, so keep it off.
    fsModuleCache: false,
  },
});
