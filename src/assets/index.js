import path from "path"

import { type Compilation } from "../compilation"
import { type FrameDefinition } from "../config"

import { Timer } from "../timer"

import { image, type ImageAsset } from "./image"
import { json, type JSONAsset } from "./json"
import { yaml, type YAMLAsset } from "./yaml"
import { markdown, type MarkdownAsset } from "./markdown"
import { html, type HTMLAsset } from "./html"
import { text, type TextAsset } from "./text"
import { pdf, type PDFAsset } from "./pdf"

export type { ImageAsset, JSONAsset, YAMLAsset, MarkdownAsset, TextAsset, HTMLAsset, PDFAsset }
export type Asset = ImageAsset | JSONAsset | YAMLAsset | MarkdownAsset | HTMLAsset | TextAsset | PDFAsset

// The type of asset handler functions
type Handler = (ctx : Compilation, defn : FrameDefinition, filename : string) => Promise<?Asset>

// Asset handlers by extension
const handlers = {
	png: image,
	jpg: image,
	jpeg: image,
	json,
	yaml,
	yml: yaml,
	md: markdown,
	txt: text,
	html,
	pdf,
}

export async function asset (ctx : Compilation, dfn : FrameDefinition, filename : string) : Promise<?Asset> {
	const timer = new Timer()
	const ext = path.extname(filename).slice(1)

	const handler : Handler = handlers[ext]
	if (!handler) {
		// No handler is found, ignore file
		ctx.warn(`Warning: No handler for ${filename}`)
		return null
	}

	// $ExpectError: Cannot spread after
	const r = await handler(ctx, dfn, filename)
	if (!r) {
		return null
	}

	ctx.log("Processed %s (%s)", filename, timer)

	return r
}
