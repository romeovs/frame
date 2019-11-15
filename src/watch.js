import path from "path"

import webpack from "webpack"
import express from "express"
import hot from "webpack-hot-middleware"

import { cerror } from "./log/capture"
import { jspath } from "./constants"
import { config as babel } from "./babel"
import { WrapWatcher } from "./shared"
import * as pcss from "./postcss"

export function watch (ctx : Compilation, manifest : manifest, entrypoints : Entrypoints) {
	ctx.log("Watching client")

	const cfg = config(ctx, entrypoints)
	const w = webpack(cfg)
	const evts = new WrapWatcher()

	// Set up express server
	const app = express()
	app.use(hot(w, {
		noInfo: true,
		publicPath: cfg.output.publicPath,
	}))
	app.use(express.static(ctx.outputdir))
	app.listen(ctx.config.port || 8080)

	ctx.log("Server listening on %s", "http://localhost:8080")

	// Start watching
	w.watch({
		aggregateTimeout: 300,
		poll: undefined,
	}, function (err, stats) {
		if (err) {
			cerror(err)
			return
		}

		const json = stats.toJson()
		ctx.log("Client built (%sms)", json.time)
		const assets = json.assetsByChunkName
		const r = entrypoints.map(function (entry) {
			const p = assets[entry.id].find(a => a.endsWith(".js"))
			return {
				type: "js",
				id: entry.id,
				src: `/${jspath}/${p}`,
			}
		})

		evts.emit("build", r)
	})

	return evts
}

function config (ctx : Compilation, entrypoints : Entrypoints) {
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
						modules: true,
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
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
						cacheDirectory: true,
						...babel(ctx, false, true),
					},
				},
			}, {
				test: /\.(png|jpe?g|woff|ttf|eot)$/,
				use: [{ loader: "file-loader" }],
			}],
		},
		plugins: [
			new webpack.HotModuleReplacementPlugin(),
		],
	}
}
