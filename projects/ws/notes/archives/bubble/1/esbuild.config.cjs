const esbuild = require('esbuild');
const sveltePlugin = require('esbuild-svelte');

esbuild.build({
	entryPoints: ['src/lib/js/main.js'], // Replace with your entry file
	bundle: true,
	outdir: 'esbuild', // Output directory
	plugins: [sveltePlugin()],
	loader: { '.js': 'jsx' }, // Handle other file types if necessary
	minify: true, // Optional: Minify the output
	sourcemap: true, // Optional: Generate source maps
}).catch((error) => {
	console.error('Build failed:', error);
	process.exit(1);
});
