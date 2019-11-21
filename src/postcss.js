import path from "path"
import fs from "fs"

import nested from "postcss-nested"
import properties from "postcss-property-lookup"
import vars from "postcss-simple-vars"

import { hash } from "./hash"
import { type Compilation } from "./compilation"

export function plugins (ctx : Compilation) : mixed {
	return [
		nested(),
		properties(),
		vars({
			variables () : {[string] : mixed } {
				const manifest = JSON.parse(fs.readFileSync(path.resolve(ctx.cachedir, "manifest.json"), "utf-8"))
				return manifest.globals || {}
			},
		}),
	]
}

export const generateScopedName = (ctx : Compilation) => function (classname : string, filename : string, css : string) : string {
	// TODO: can this be short in production?
	return `${classname}_${hash(css.replace(/\s/g, ""))}`
}
