import path from "path"

import babel from "rollup-plugin-babel"
import resolve from "rollup-plugin-node-resolve"
import external from "rollup-plugin-node-externals"
import hashbang from "rollup-plugin-hashbang"

const extensions = [
	".js",
	".json",
]

const pkg = require("./package.json")
const deps = Object.keys(pkg.dependencies || {})
const peers = Object.keys(pkg.peerDependencies || {})

const base = {
	treeshake: false,
	external: [ ...deps, ...peers, "react-dom/server" ],
	plugins: [
		resolve({
			extensions,
			preferBuiltins: true,
		}),
		external({
			builtins: true,
			deps: true,
			peerdeps: true,
		}),
		babel({
			exclude: "node_modules/**",
			extensions,
			babelrc: false,
			presets: [
				[
					"@babel/preset-env",
					{
						modules: false,
						useBuiltIns: "usage",
						corejs: 3,
						targets: {
							node: true,
						},
					},
				],
				"@babel/preset-react",
				"@babel/preset-flow",
			],
			plugins: [
				"@babel/plugin-proposal-optional-chaining",
			],
		}),
		hashbang(),
	],
}

export default [
	{
		...base,
		input: path.resolve("src/cli/index.js"),
		output: {
			file: path.resolve("dist/cli.js"),
			format: "cjs",
			sourcemap: true,
		},
	},
	{
		...base,
		input: path.resolve("src/lib/client.js"),
		output: {
			file: path.resolve("dist/lib/client.js"),
			format: "esm",
			sourcemap: true,
		},
	},
	{
		...base,
		input: path.resolve("src/lib/server.js"),
		output: {
			file: path.resolve("dist/lib/server.js"),
			format: "esm",
			sourcemap: true,
		},
	},
]
