import path from "path"

import Timer from "./timer"

import { rollup } from "rollup"
import babel from "rollup-plugin-babel"
import resolve from "rollup-plugin-node-resolve"
import builtins from "builtin-modules"

import { type Compilation } from "./compilation"
import { print, plugins } from "./shared"
import { plugin } from "./plugin"
import { hash } from "./hash"

const extensions = [
	".js",
]

type AssetInfo = {
	assets : mixed,
	sources : mixed,
}

function config (ctx : Compilation) : mixed {
	/* eslint-disable global-require */

	const pkg = require(path.resolve(__dirname, "../package.json"))
	const deps = Object.keys(pkg.dependencies || {})
	const peers = Object.keys(pkg.peerDependencies || {})

	return {
		perf: true,
		input: path.resolve(ctx.config.root, "frame.js"),
		output: {
			dir: path.resolve(ctx.cachedir, "server"),
			format: "cjs",
			sourcemap: false,
		},
		external: [ ...deps, ...peers, ...builtins ],
		treeshake: false,
		plugins: [
			resolve({
				extensions,
				preferBuiltins: true,
			}),
			babel({
				babelrc: false,
				exclude: "node_modules/**",
				extensions,
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
					plugin,
					"babel-plugin-transform-dirname-filename",
					"@babel/plugin-syntax-dynamic-import",
					[
						"babel-plugin-module-resolver",
						{
							extensions,
							alias: {
								"frame": path.resolve(__dirname, "lib/lib/server"),
							},
						},
					],
				],
			}),
			...plugins(ctx),
		],
	}
}

export async function server (ctx : Compilation, assets : AssetInfo) : string {
	const timer = new Timer()
	ctx.log("Building server")

	const c = config(ctx, assets)
	const bundle = await rollup(c)

	const timings = bundle.getTimings()
	print(ctx, "Server bundle", timings)

	await bundle.write(c.output)
	ctx.log("Server built (%s)", timer)

	return path.resolve(ctx.cachedir, "server/frame.js")
}
