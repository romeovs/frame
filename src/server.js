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

const extensions = [
	".js",
]

export async function server (ctx : Compilation, manifest : Manifest, entrypoints : Entrypoints) : Assets {
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
	return marshal(ctx, output)
}

function marshal (ctx : Compilation, output : mixed) : Assets {
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
