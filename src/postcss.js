import path from "path"
import fs from "fs"

import nested from "postcss-nested"
import properties from "postcss-property-lookup"
import vars from "postcss-simple-vars"
import url from "postcss-url"

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
		url({
			url (asset, dir) {
				const { hash: hsh, search, absolutePath } = asset
				let h = null
				try {
					 h = hash(fs.readFileSync(absolutePath))
				} catch (err) {
					// TODO: this is very hacky, can we avoid double loading?
					return absolutePath.replace(/^.*\/_\//, "/_/")
				}

				const ext = path.extname(absolutePath)
				const to = path.join(ctx.outputdir, "_", `${h}${ext}`)

				fs.mkdirSync(path.join(ctx.outputdir, "_"), { recursive: true })
				fs.copyFileSync(absolutePath, to)

				// TODO: also gzip and brotli

				return `/_/${h}${ext}${search}${hsh}`
			},
		}),
	]
}

export const generateScopedName = (ctx : Compilation) => function (classname : string, filename : string, css : string) : string {
	// TODO: can this be short in production?
	return `${classname}_${hash(css.replace(/\s/g, ""))}`
}
