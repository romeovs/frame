import EventEmitter from "events"

import postcss from "rollup-plugin-postcss"
import url from "rollup-plugin-url"

import * as pcss from "./postcss"

import { format } from "./timer"
import { jspath } from "./constants"

type Timings = {
	string : [ number, number, number ],
}

export function print (ctx : Compilation, pfx : string, timings : Timings) {
	for (const key in timings) {
		const t = timings[key]
		ctx.debug(`${pfx} %s (%s)`, key, format(Math.round(t[0])))
	}
}

export function plugins (ctx : Compilation) {
	return [
		postcss({
			modules: {
				generateScopedName: pcss.generateScopedName,
			},
			extract: true,
			inject: true,
			sourceMap: true,
			minimize: !ctx.config.dev,
			plugins: pcss.plugins(ctx),
			parser: "sugarss",
		}),
		url({
			limit: 0,
			emitFiles: true,
			include: [
				"**/*.svg",
				"**/*.png",
				"**/*.jpg",
				"**/*.jpeg",
				"**/*.ttf",
				"**/*.woff",
				"**/*.eot",
			],
			publicPath: `/${jspath}/`,
		}),
	]
}

export class WrapWatcher extends EventEmitter {
	constructor (closer) {
		super()
		this._closer = closer
	}

	close () {
		this._closer.close()
	}
}
