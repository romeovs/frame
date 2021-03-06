import path from "path"

import babel from "rollup-plugin-babel"
import resolve from "rollup-plugin-node-resolve"
import external from "rollup-plugin-node-externals"
import hashbang from "rollup-plugin-hashbang"
import replace from "@rollup/plugin-replace"
import json from "@rollup/plugin-json"

import { name } from "./src/pkg"

const extensions = [
	".js",
	".json",
]

const pkg = require("./package.json")
const deps = Object.keys(pkg.dependencies || {})
const peers = Object.keys(pkg.peerDependencies || {})

const base = {
	treeshake: true,
	external: [ ...deps, ...peers, "react-dom/server", `${name}/head` ],
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
		json(),
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
				[
					"@babel/preset-flow",
					{
						all: true,
					},
				],
			],
			plugins: [
				"@babel/plugin-proposal-optional-chaining",
			],
		}),
		hashbang(),
		replace({
			"__PACKAGE_NAME__": name,
		}),
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
	{
		...base,
		input: path.resolve("src/lib/head.js"),
		output: {
			file: path.resolve("dist/lib/head.js"),
			format: "esm",
			sourcemap: true,
		},
	},
	{
		...base,
		input: path.resolve("src/lib/validate.js"),
		output: {
			file: path.resolve("dist/lib/validate.js"),
			format: "esm",
			sourcemap: true,
		},
	},
	{
		...base,
		input: path.resolve("src/lib/hooks/index.js"),
		output: {
			file: path.resolve("dist/lib/hooks.js"),
			format: "esm",
			sourcemap: true,
		},
	},
]
