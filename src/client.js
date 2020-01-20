import path from "path"

import { rollup } from "rollup"
import resolve from "rollup-plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"
import replace from "@rollup/plugin-replace"
import { terser } from "rollup-plugin-terser"

import { Timer } from "./timer"
import { babel } from "./babel"
import { print, plugins } from "./shared"
import { jspath } from "./constants"
import { full } from "./compress/dictionary"

import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"
import { type Entrypoints } from "./entrypoints"

export type Stylesheet = {
	type : "css",
	src : string,
	content : string,
}

export type Script = {
	type : "js",
	id : string,
	src : string,
}

export type BuildAsset = Stylesheet | Script
export type BuildAssets = BuildAsset[]

type RollupChunk = {
	isAsset : boolean,
	isEntry : boolean,
	fileName : string,
	source : string,
	code : string,
	map : string,
	facadeModuleId : string,
}

export async function client (ctx : Compilation, manifest : Manifest, entrypoints : Entrypoints, modern : boolean) : Promise<BuildAssets> {
	const timer = new Timer()
	ctx.log("Building client (modern=%s)", modern)

	const js = entrypoints.map(e => e.entrypoint)
	const cfg = config(ctx, manifest, modern, js)

	const bundle = await rollup(cfg)
	const timings = bundle.getTimings()
	print(ctx, "Client bundle", timings)

	// $ExpectError: Flow does not know rollup
	const { output } = await bundle.generate(cfg.output)
	await write(ctx, output)
	ctx.log("Client built (modern=%s) (%s)", modern, timer)

	return marshal(ctx, output)
}

function marshal (ctx : Compilation, output : RollupChunk[]) : BuildAssets {
	return (
		output
			// .filter(asset => asset.fileName.endsWith(".css") || asset.fileName.endsWith(".js"))
			.map(function (asset : RollupChunk) : BuildAsset {
				if ((asset.fileName.endsWith(".mjs") || asset.fileName.endsWith(".js")) && !asset.isEntry) {
					return {
						type: "js",
						src: `/${jspath}/${asset.fileName}`,
						file: asset.facadeModuleId,
					}
				}

				if (asset.fileName.endsWith(".css")) {
					return {
						type: "css",
						src: `/${jspath}/${asset.fileName}`,
						content: asset.source,
					}
				}

				if (asset.facadeModuleId) {
					return {
						src: `/${jspath}/${asset.fileName}`,
						id: path.basename(asset.facadeModuleId).replace(".js", ""),
						type: "js",
					}
				}
			})
			.filter(x => Boolean(x))
	)
}

const extensions = [
	".js",
	".json",
]

function config (ctx : Compilation, manifest : Manifest, modern : boolean, js : string[]) : mixed {
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
					/* eslint-disable global-require */
					"node_modules/react/index.js": Object.keys(require("react")),
					"node_modules/react-dom/index.js": Object.keys(require("react-dom")),
					"node_modules/react-router/index.js": Object.keys(require("react-router")),
					"node_modules/react-router-dom/index.js": Object.keys(require("react-router-dom")),
					"node_modules/react-is/index.js": [ "isValidElementType" ],
				},
				sourceMap: !ctx.config.dev,
			}),
			replace({
				"process.env.NODE_ENV": JSON.stringify(ctx.config.dev ? "development" : "production"),
				"global.DEV": JSON.stringify(ctx.config.dev),
				"global.DICTIONARY": JSON.stringify(manifest.dictionary),
				"global.ALPHABET": JSON.stringify(full.substring(0, manifest.dictionary.length)),
				"global.IS_SERVER": false,
			}),
			babel(ctx, false, modern),
			...plugins(ctx),
			ctx.config.dev ? {} : terser(),
		],
	}
}

// Write the bundle to disk
async function write (ctx : Compilation, output : RollupChunk[]) {
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
