import path from "path"

import { rollup } from "rollup"
import babel from "rollup-plugin-babel"
import resolve from "rollup-plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"
import replace from "@rollup/plugin-replace"
import { terser } from "rollup-plugin-terser"

import Timer from "./timer"
import { type Compilation } from "./compilation"
import { print, plugins } from "./shared"
import { hash } from "./hash"
import { jspath } from "./constants"

const extensions = [
	".js",
	".jsx",
	".json",
]

function config (ctx : Compilation, modern : boolean, routes : mixed[]) : mixed {
	/* eslint-disable global-require */
	const input = Object.values(routes).map(function (r) {
		return path.resolve(ctx.cachedir, "client", `${r.entryid}.js`)
	})

	return {
		perf: true,
		input,
		output: {
			dir: path.resolve(ctx.config.output, jspath),
			format: modern ? "es" : "system",
			sourcemap: true,
			entryFileNames: modern ? "e.[hash].mjs" : "e.[hash].js",
			chunkFileNames: modern ? "[hash].mjs" : "[hash].js",
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
				},
			}),
			replace({
				"process.env.NODE_ENV": JSON.stringify(ctx.config.dev ? "development" : "production"),
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
							targets: modern ? { esmodules: true } : config.browsers,
						},
					],
					"@babel/preset-react",
					"@babel/preset-flow",
				],
				plugins: [
					"@babel/plugin-syntax-dynamic-import",
					"@babel/plugin-proposal-optional-chaining",
					[
						"babel-plugin-module-resolver",
						{
							extensions,
							alias: {
								frame: path.resolve(__dirname, "lib/lib/client"),
							},
						},
					],
				],
			}),
			...plugins(ctx),
			ctx.config.dev ? {} : terser(),
		],
	}
}

async function build (ctx : Compilation, modern : boolean, assets) : Promise<Asset> {
	const timer = new Timer()
	ctx.log("Building client (modern=%s)", modern)

	const c = config(ctx, modern, assets)
	const bundle = await rollup(c)
	const timings = bundle.getTimings()
	print(ctx, "Client bundle", timings)

	const { output } = await bundle.generate(c.output)
	await write(ctx, output)
	ctx.log("Client built (modern=%s) (%s)", modern, timer)

	return (
		output
			.filter(asset => asset.isEntry)
			.map(function (asset : mixed) {
				return {
					src: `/${jspath}/${asset.fileName}`,
					id: path.basename(asset.facadeModuleId).replace(".js", ""),
				}
			})
	)
}

export async function client (ctx : Compilation, assets) : Promise<Asset> {
	const [ modern, legacy ] = await Promise.all([
		build(ctx, true, assets),
		ctx.config.dev ? [] : build(ctx, false, assets),
	])

	return {
		modern,
		legacy,
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
