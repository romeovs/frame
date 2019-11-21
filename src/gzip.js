import zopfli from "node-zopfli"

import { Timer } from "./timer"
import { type Compilation } from "./compilation"

const exts = [
	".js",
	".mjs",
	".css",
	".html",
	".json",
	".ttf",
]

// Gzip the contents and write to filename
export async function gzip (ctx : Compilation, filename : string, content : string | Buffer) {
	const timer = new Timer()
	if (ctx.config.dev || !gzippable(filename)) {
		return
	}

	const original = Buffer.from(content)
	const gzipped = await zopfli.gzip(original)

	// Check if file is actually smaller and remove if otherwise
	if (gzipped.length > original.length) {
		ctx.debug("Skipping Gzip for %s", filename)
		return
	}

	const f = await ctx._writeFile(`${filename}.gz`, gzipped)
	ctx.debug("Gzipped %s (%s)", f, timer)
}

function gzippable (filename : string) : boolean {
	for (const ext of exts) {
		if (filename.endsWith(ext)) {
			return true
		}
	}

	return false
}
