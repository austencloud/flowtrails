import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			$lib: './src/lib',
			$shared: './src/lib/shared',
			$video: './src/lib/modules/video-management',
			$pipeline: './src/lib/modules/effect-pipeline',
			$threshold: './src/lib/modules/threshold-detection',
			$trails: './src/lib/modules/trail-effects',
			$export: './src/lib/modules/video-export'
		}
	}
};

export default config;
