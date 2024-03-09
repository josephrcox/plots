import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	build: {
		outDir: './docs', // relative to index.html
		assetsDir: 'assets',
		watch: true,
		base: '/plots/',
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
		},
	},
});
