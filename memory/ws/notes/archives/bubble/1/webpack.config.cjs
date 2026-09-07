const path = require('path');

module.exports = {
	entry: './src/lib/js/index.js', // Entry point
	output: {
		path: path.resolve(__dirname, 'webpack'), // Output directory
		filename: 'webseriously.bundle.js', // Output file name
	},
	mode: 'development', // Use 'production' for production builds
	module: {
		rules: [
			{
				test: /\.css$/i, // Process CSS files
				use: ['style-loader', 'css-loader'
				],
			},
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: 'ts-loader',
			},
			{
				test: /\.mjs$/,
				include: /node_modules/,
				type: 'javascript/auto',
			},
			{
				test: /\.svelte$/,
				exclude: /node_modules/,
				use: {
					loader: 'svelte-loader',
					options: {
						preprocess: require('svelte-preprocess')(),
					},
				},
			},
		],
	},
	devServer: {
		static: path.resolve(__dirname, 'webpack'), // Serve files from 'webpack'
		port: 3000, // Development server port
	},
	resolve: {
		alias: {
			svelte: path.resolve('node_modules', 'svelte'),
		},
		extensions: ['.mjs', '.js', '.svelte', '.ts'],
		mainFields: ['svelte', 'browser', 'module', 'main'],
	},
};
