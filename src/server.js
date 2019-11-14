import path from "path"

import { rollup, watch as Watch } from "rollup"
import resolve from "rollup-plugin-node-resolve"
import builtins from "builtin-modules"

import Timer from "./timer"
import { print, plugins, WrapWatcher } from "./shared"
import { babel } from "./babel"

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
	return marshal(ctx, output)
}

function marshal (ctx, output) {
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

export function watch (ctx : Compilation, manifest : Manifest, entrypoints : Entrypoints) {
	ctx.log("Watching server")

	const js = entrypoints.map(e => e.entrypoint)
	const cfg = config(ctx, js)

	const watcher = Watch(cfg)
	const evts = new WrapWatcher(watcher)

	watcher.on("event", async function (evt) {
		switch (evt.code) {
		case "START":
			ctx.log("Building server")
			break
		case "BUNDLE_END": {
			const bundle = evt.result
			const timings = bundle.getTimings()
			print(ctx, "Server bundle", timings)

			const { output } = await bundle.generate(cfg.output)
			await bundle.write(cfg.output)
			ctx.log("Server built (%sms)", evt.duration)

			evts.emit("build", marshal(ctx, output))
		}
		}
	})

	return evts
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
