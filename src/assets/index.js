import path from "path"

import { type Compilation } from "../compilation"
import { type Manifest } from "../manifest"

import Timer from "../timer"
import { hash } from "../hash"

import { image, type ImageAsset } from "./image"
import { json, type JSONAsset } from "./json"
import { yaml, type YAMLAsset } from "./yaml"
import { markdown, type MarkdownAsset } from "./markdown"

export type Asset = ImageAsset | JSONAsset | YAMLAsset | MarkdownAsset

// The type of asset handler functions
type Handler = (ctx : Compilation, filename : string) => Promise<?Asset>
type Handlers = {[string] : Handler }

// Asset handlers by extension
const handlers : Handlers = {
	png: image,
	jpg: image,
	jpeg: image,
	json,
	yaml,
	yml: yaml,
	md: markdown,
}

export async function asset (ctx : Compilation, manifest : Manifest, filename : string) : Promise<?Asset> {
	const timer = new Timer()
	const ext = path.extname(filename).slice(1)

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
		id: hash(filename),
	}
}
