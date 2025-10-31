import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test-setup.ts']
  },
  resolve: {
    alias: {
      $lib: './src/lib',
      $shared: './src/lib/shared',
      $effects: './src/lib/modules/effects',
      $video: './src/lib/modules/video-management'
    }
  }
});
