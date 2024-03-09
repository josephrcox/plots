import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	base: '/plots/',
	plugins: [svelte()],
	build: { outDir: './docs', assetsDir: 'assets', watch: true },
	resolve: { alias: { $lib: path.resolve('./src/lib') } },
});
