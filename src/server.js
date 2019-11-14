import path from "path"

import { rollup } from "rollup"
import resolve from "rollup-plugin-node-resolve"
import builtins from "builtin-modules"

import Timer from "./timer"
import { print, plugins } from "./shared"
import { babel } from "./babel"
import { jspath } from "./constants"

const extensions = [
	".js",
]

export async function server (ctx : Compilation, manifest : Manifest, entrypoints : Entrypoints) {
	const timer = new Timer()
	ctx.log("Building server")

	const js = entrypoints.map(e => e.entrypoint)
	const cfg = config(ctx, js)

	const bundle = await rollup(cfg)

	const timings = bundle.getTimings()
	print(ctx, "Server bundle", timings)

	await bundle.write(cfg.output)
	ctx.log("Server built (%s)", timer)

	const { output } = await bundle.generate(cfg.output)

	return (
		output
			.filter(asset => asset.isEntry)
			.map(function (asset : mixed) : JSMap {
				return {
					src: `${ctx.cachedir}/server/${asset.fileName}`,
					id: path.basename(asset.facadeModuleId).replace(".js", ""),
				}
			})
	)
}

function config (ctx : Compilation, js : string[]) : mixed {
	/* eslint-disable global-require */

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
			babel(ctx, true, false),
			...plugins(ctx),
		],
	}
}
