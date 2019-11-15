import path from "path"

import { type Compilation } from "../compilation"

import image from "./image"
import json from "./json"
import yaml from "./yaml"

import Timer from "../timer"

// The type of asset handler functions
type Handler = (ctx : Compilation, filename : string) => Promise<?Asset>

// export async function assets (ctx : Compilation, manifest : Manifest) {
// 	const timer = new Timer()
//
// 	ctx.log("Processing assets")
// 	await Promise.all(manifest.assets.map(a => asset(ctx, a)))
// 	ctx.log("Assets processed (%s)", timer)
// }

// Asset handlers by extension
const handlers = {
	png: image,
	jpg: image,
	jpeg: image,
	json,
	yaml,
	yml: yaml,
}

function extension (filename : string) : string {
	return path.extname(filename).slice(1)
}

export async function asset (ctx : Compilation, manifest : Manifest, filename : string) : Promise<?Asset> {
	const timer = new Timer()
	const ext = extension(filename)

	const handler : Handler = handlers[ext]
	if (!handler) {
		// No handler is found, ignore file
		ctx.warn(`Warning: No handler for ${filename}`)
		return null
	}

	const r = await handler(ctx, manifest, filename)
	if (!r) {
		return null
	}

	ctx.log("Processed %s (%s)", filename, timer)

	return {
		...r,
		filename: filename.replace(path.resolve(ctx.config.root), ""),
	}
}
