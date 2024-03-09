import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	build: {
		outDir: './docs', // relative to index.html
		assetsDir: './plots/assets',
		// emptyOutDir: true, // true if outDir is inside root. if outDir is not inside root, uncomment this.
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
		},
	},
});
