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

export default {
	input: path.resolve("src/cli/index.js"),
	output: {
		file: path.resolve("dist/cli.js"),
		format: "cjs",
		sourcemap: true,
	},
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
		}),
		hashbang(),
	],
}
