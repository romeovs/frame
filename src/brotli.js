import Brotli from "brotli"

import Timer from "./timer"

const exts = [
	".js",
	".mjs",
	".css",
	".html",
	".json",
	".ttf",
]

// Brotli compress the contents and write to filename
export async function brotli (ctx : Compilation, filename : string, content : string) {
	const timer = new Timer()
	if (ctx.config.dev || !brotliable(filename)) {
		return
	}

	const compressed = await Brotli.compress(Buffer.from(content), {
		mode: 1,
		quality: 11,
	})

	if (!compressed) {
		ctx.debug("Skipping Brotli for %s", filename)
		return
	}

	await ctx._writeFile(`${filename}.br`, compressed)
	ctx.debug("Brotli compressed %s (%s)", filename, timer)
}

function brotliable (filename : string) : boolean {
	for (const ext of exts) {
		if (filename.endsWith(ext)) {
			return true
		}
	}

	return false
}
