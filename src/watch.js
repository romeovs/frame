import path from "path"

import webpack, { type WebpackError, type Stats, type WebpackOptions } from "webpack"
import express from "express"
import hot from "webpack-hot-middleware"

import { cerror } from "./log/capture"
import { jspath } from "./constants"
import { config as babel } from "./babel"
import { WrapWatcher } from "./shared"
import { type Compilation } from "./compilation"
import { type BuildAssets } from "./client"
import { type Manifest } from "./manifest"
import { type Entrypoints } from "./entrypoints"
import { type Script } from "./client"
import * as pcss from "./postcss"
import { full } from "./compress/dictionary"
import { listen } from "./listen"

interface Emitter {
	on ("build", (BuildAssets => void) | (BuildAssets => Promise<void>)) : void,
	close () : void,
}

export function watch (ctx : Compilation, manifest : Manifest, entrypoints : Entrypoints) : Emitter {
	ctx.log("Watching client")

	const cfg = config(ctx, manifest, entrypoints)
	const w = webpack(cfg)

	// $ExpectError: TODO, can we coerce here?
	const evts = new WrapWatcher(w)

	// Set up express server
	const app = express()
	app.use(hot(w, {
		noInfo: true,
		publicPath: cfg.output?.publicPath,
	}))
	app.use(express.static(ctx.outputdir))
	listen(ctx, app)

	ctx.log("Server listening on %s", "http://localhost:8080")

	// Start watching
	w.watch({
		aggregateTimeout: 300,
		poll: undefined,
	}, function (err : WebpackError, stats : Stats) {
		if (err) {
			cerror(err)
			return
		}

		const json = stats.toJson()
		ctx.log("Client built (%sms)", json.time)
		const assets = json.assetsByChunkName
		const r = entrypoints.map(function (entry : mixed) : Script {
			// $ExpectError: Flow does not know webpack assets
			const { id } = entry
			const p = assets[id].find(a => a.endsWith(".js"))
			return {
				id,
				type: "js",
				src: `/${jspath}/${p}`,
			}
		})

		evts.emit("build", r)
	})

	// $ExpectError: TODO, can we coerce here?
	return evts
}

function config (ctx : Compilation, manifest : Manifest, entrypoints : Entrypoints) : WebpackOptions {
	const f = Array.from(new Set(entrypoints.map(e => e.entrypoint)))
	const entries = {}
	for (const e of f) {
		const id = path.basename(e).replace(".js", "")
		entries[id] = [
			"webpack-hot-middleware/client?reload=true",
			e,
		]
	}

	return {
		mode: "development",
		entry: entries,
		target: "web",
		devtool: ctx.config.dev ? "cheap-module-source-map" : "source-map",
		output: {
			filename: "e.[name].[hash:8].js",
			chunkFilename: "[id].[chunkhash:8].js",
			path: path.resolve(ctx.outputdir, jspath),
			publicPath: `/${jspath}/`,
		},
		module: {
			rules: [{
				test: /\.css$/,
				use: [{ loader: "style-loader" }, {
					loader: "css-loader",
					options: {
						importLoaders: 1,
						modules: {
							localIdentName: "[local]_[hash:base64:8]",
						},
					},
				}, {
					loader: "postcss-loader",
					options: {
						parser: "sugarss",
						plugins: pcss.plugins(ctx),
					},
				}],
			}, {
				test: /\.js$/,
				include: [
					new RegExp(__dirname),
					new RegExp(ctx.config.root),
					new RegExp(ctx.cachedir),
				],
				use: {
					loader: "babel-loader",
					options: {
						cacheDirectory: true,
						...babel(ctx, false, true),
					},
				},
			}, {
				test: /\.(png|jpe?g|woff|ttf|eot|pdf|mp4|webm)$/,
				use: [{ loader: "file-loader" }],
			}],
		},
		plugins: [
			new webpack.HotModuleReplacementPlugin(),
			new webpack.DefinePlugin({
				"process.env.NODE_ENV": "\"development\"",
				"global.DEV": "true",
				"global.DICTIONARY": JSON.stringify(manifest.dictionary || []),
				"global.ALPHABET": JSON.stringify(full.substring(0, manifest.dictionary.length)),
			}),
		],
	}
}
