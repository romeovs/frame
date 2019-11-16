import path from "path"

import { type Compilation } from "../compilation"

import image from "./image"
import json from "./json"
import yaml from "./yaml"
import markdown from "./markdown"

import Timer from "../timer"
import { hash } from "../hash"

// The type of asset handler functions
type Handler = (ctx : Compilation, filename : string) => Promise<?Asset>


// Asset handlers by extension
const handlers = {
	png: image,
	jpg: image,
	jpeg: image,
	json,
	yaml,
	yml: yaml,
	md: markdown,
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
		// filename: filename.replace(path.resolve(ctx.config.root), ""),
		id: hash(filename),
	}
}
