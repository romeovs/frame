import path from "path"

import { rollup } from "rollup"
import resolve from "rollup-plugin-node-resolve"
import builtins from "builtin-modules"
import commonjs from "rollup-plugin-commonjs"

import { Timer } from "./timer"
import { print, plugins } from "./shared"
import { babel } from "./babel"

import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"
import { type Entrypoints } from "./entrypoints"
import { type BuildAssets, type BuildAsset } from "./client"

const extensions = [
	".js",
]

export async function server (ctx : Compilation, manifest : Manifest, entrypoints : Entrypoints) : Promise<BuildAssets> {
	const timer = new Timer()
	ctx.log("Building server")

	const js = entrypoints.map(e => e.entrypoint)
	const cfg = config(ctx, js)

	const bundle = await rollup(cfg)

	const timings = bundle.getTimings()
	print(ctx, "Server bundle", timings)

	// $ExpectError: Fix this when we have typing for rollup config
	await bundle.write(cfg.output)
	ctx.log("Server built (%s)", timer)

	// $ExpectError: Fix this when we have typing for rollup config
	const { output } = await bundle.generate(cfg.output)
	return marshal(ctx, output)
}

function marshal (ctx : Compilation, output : mixed[]) : BuildAssets {
	return (
		output
			// $ExpectError: Fix this when we have typing for rollup
			.filter(asset => asset.isEntry)
			.map(function (asset : mixed) : BuildAsset {
				return {
					type: "js",

					// $ExpectError: Fix this when we have typing for rollup
					src: `${ctx.cachedir}/server/${asset.fileName}`,

					// $ExpectError: Fix this when we have typing for rollup
					id: path.basename(asset.facadeModuleId).replace(".js", ""),
				}
			})
	)
}

function config (ctx : Compilation, js : string[]) : mixed {
	/* eslint-disable global-require */

	// $ExpectError: Flow cannot handle dynamic imports.
	const pkg = require(path.resolve(__dirname, "../package.json"))
	const deps = Object.keys(pkg.dependencies || {})
	const peers = Object.keys(pkg.peerDependencies || {})

	return {
		perf: true,
		input: js,
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
			commonjs({
				extensions,
				include: [
					"node_modules/**",
				],
				sourceMap: !ctx.config.dev,
			}),
			babel(ctx, true, false),
			...plugins(ctx),
		],
	}
}
