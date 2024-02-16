module.exports = {
	preprocess: require('svelte-preprocess')({
		typescript: {
			rootDir: './src',
		},
	}),
};
