module.exports = {
	preprocess: require('svelte-preprocess')({
		typescript: {
			rootDir: '$lib',
		},
	}),
	onwarn: (warning, handler) => {
		if (warning.code.startsWith('a11y-')) return;
		handler(warning);
	},
};
