import path from "path"

import terser from "terser"

import fs from "./fs"
import { jspath } from "./constants"
import { Timer } from "./timer"
import { type Compilation } from "./compilation"
import { type Asset } from "./assets"
import { hash } from "./hash"

const polyfills = [
	"node_modules/es6-promise/dist/es6-promise.auto.js",
	"node_modules/whatwg-fetch/dist/fetch.umd.js",
	"node_modules/systemjs/dist/s.min.js",
]

// Installs system js bundle
export async function system (ctx : Compilation) : Promise<Asset> {
	const timer = new Timer()

	const content = await Promise.all(
		polyfills
			.map(file => fs.readFile(path.resolve(file), "utf-8")),
	)

	const min = terser.minify(content.join(""), {
		toplevel: false,
		sourceMap: {
		},
	})
	const h = await hash(min.code)
	const src = `/${jspath}/s.${h}.js`

	const comment = `//# sourceMappingURL=${src}.map`
	await ctx.write(src, min.code.concat(comment))
	await ctx.write(`/${jspath}/s.${h}.js.map`, min.map)

	ctx.log("Copied System.js polyfills (%s)", timer)

	return src
}
