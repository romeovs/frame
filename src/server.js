import path from "path"

import Timer from "./timer"

import { rollup, watch as Watcher } from "rollup"
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

export async function server (ctx : Compilation) : string {
	const timer = new Timer()
	ctx.log("Building server")

	const cfg = config(ctx)
	const bundle = await rollup(cfg)

	const timings = bundle.getTimings()
	print(ctx, "Server bundle", timings)

	await bundle.write(cfg.output)
	ctx.log("Server built (%s)", timer)

	return path.resolve(ctx.cachedir, "server/frame.js")
}

export function watch (ctx : Compilation) {
	ctx.log("Watching server")

	const cfg = config(ctx)
	const watcher = Watcher(cfg)

	watcher.on("event", async function (evt) {
		switch (evt.code) {
		case "START":
			ctx.log("Server building")
			break
		case "BUNDLE_END":
			print(ctx, "Server bundle", evt.result.getTimings())
			await evt.result.write(cfg.output)
			ctx.log("Server built (%sms)", evt.duration)
			break
		}
	})

	return watcher
}
