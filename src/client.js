import path from "path"

import { rollup } from "rollup"
import resolve from "rollup-plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"
import replace from "@rollup/plugin-replace"
import { terser } from "rollup-plugin-terser"

import Timer from "./timer"
import { babel } from "./babel"
import { print, plugins } from "./shared"
import { jspath } from "./constants"

type JSMap = {
	id : string,
	src : string,
}

export async function client (ctx : Compilation, manifest : Manifest, entrypoints : Entrypoints, modern : boolean) : Promise<JSMap> {
	const timer = new Timer()
	ctx.log("Building client (modern=%s)", modern)

	const js = entrypoints.map(e => e.entrypoint)
	const cfg = config(ctx, modern, js)

	const bundle = await rollup(cfg)
	const timings = bundle.getTimings()
	print(ctx, "Client bundle", timings)

	const { output } = await bundle.generate(cfg.output)
	await write(ctx, output)
	ctx.log("Client built (modern=%s) (%s)", modern, timer)

	return marshal(ctx, output)
}

function marshal (ctx, output) {
	return (
		output
			.filter(asset => asset.isEntry || asset.fileName.endsWith(".css"))
			.map(function (asset : mixed) : JSMap {
				if (asset.fileName.endsWith(".css")) {
					return {
						src: `/${jspath}/${asset.fileName}`,
						content: asset.source,
						type: "css",
					}
				}
				return {
					src: `/${jspath}/${asset.fileName}`,
					id: path.basename(asset.facadeModuleId).replace(".js", ""),
					type: "js",
				}
			})
	)
}

const extensions = [
	".js",
	".json",
]

function config (ctx : Compilation, modern : boolean, js : string[]) : mixed {
	return {
		perf: true,
		input: js,
		output: {
			dir: path.resolve(ctx.config.output, jspath),
			format: modern ? "es" : "system",
			sourcemap: !ctx.config.dev,
			entryFileNames: modern ? "e.[hash].mjs" : "e.[hash].js",
			chunkFileNames: modern ? "[hash].mjs" : "[hash].js",
			indent: false,
		},
		treeshake: !ctx.config.dev,
		plugins: [
			resolve({
				browser: true,
				extensions,
				preferBuiltins: true,
			}),
			commonjs({
				extensions,
				include: [
					"node_modules/**",
				],
				namedExports: {
					"node_modules/react/index.js": Object.keys(require("react")),
					"node_modules/react-dom/index.js": Object.keys(require("react-dom")),
					"node_modules/react-head/dist/index.esm.js": Object.keys(require("react-head")),
				},
				sourceMap: !ctx.config.dev,
			}),
			replace({
				"process.env.NODE_ENV": JSON.stringify(ctx.config.dev ? "development" : "production"),
			}),
			babel(ctx, false, modern),
			...plugins(ctx),
			ctx.config.dev ? {} : terser(),
		],
	}
}

// Write the bundle to disk
async function write (ctx : Compilation, output : mixed) {
	const promises = []

	for (const chunk of output) {
		ctx.debug("Writing client file %s", chunk.fileName)

		if (chunk.isAsset) {
			promises.push(ctx.write(`/${jspath}/${chunk.fileName}`, chunk.source))
		}

		let comment = ""
		if (chunk.map) {
			comment = `//# sourceMappingURL=/${jspath}/${chunk.fileName}.map`
			promises.push(ctx.write(`/${jspath}/${chunk.fileName}.map`, chunk.map.toString()))
		}

		promises.push(ctx.write(`/${jspath}/${chunk.fileName}`, chunk.code + comment))
	}

	await Promise.all(promises)
}
