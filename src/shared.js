import postcss from "rollup-plugin-postcss"
import { hash } from "./hash"
import { format } from "./timer"

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
				generateScopedName (classname : string, filename : string, css : string) : string {
					return `${classname}_${hash(css.replace(/\s/g, ""))}`
				},
			},
			extract: true,
			inject: true,
			sourceMap: true,
			minimize: !ctx.config.dev,
			plugins: [
				// TODO
			],
		}),
	]
}
