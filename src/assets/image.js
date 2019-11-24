import path from "path"
import sharp from "sharp"
import gip from "cssgip"

import fs from "../fs"
import { hash } from "../hash"
import { Timer } from "../timer"
import { impath } from "../constants"

import { type Compilation } from "../compilation"
import { type FrameDefinition, type ImageFormat } from "../config"

export type ImageAsset = {
	type : "image",
	id : string,
	width : number,
	height : number,
	formats : ImageFormat[],
	matrix : string[],
	color : ?string,
	gradient : ?string[],
}

type Metadata = {
	width : number,
	format : ImageFormat,
}

export async function image (ctx : Compilation, manifest : FrameDefinition, filename : string) : Promise<ImageAsset> {
	const img = sharp(filename)
	const metadata = await img.metadata()

	// $ExpectError: Flow does not know about recursive
	await fs.mkdir(path.resolve(ctx.config.output, impath), { recursive: true })

	const [
		{ matrix, formats },
		css,
	] = await Promise.all([
		immatrix(ctx, manifest, metadata, filename),
		// $ExpectError: TODO make cache generic
		manifest.images?.gip ? ctx.cache([ filename, "gip" ], () => gip(filename)) : {},
	])

	return {
		type: "image",
		id: hash(filename),
		width: metadata.width,
		height: metadata.height,
		formats,
		matrix,
		color: css.background,
		gradient: css.gradient,
	}
}

async function immatrix (ctx : Compilation, manifest : FrameDefinition, metadata : Metadata, filename : string) : Promise<{ matrix : string[], formats : ImageFormat[]}> {
	const promises = []

	const formats =
		manifest.images?.formats[metadata.format]
		|| manifest.images?.formats?.["*"]
		|| [ metadata.format ]

	// Truncate the sizes to the max width
	const truncated = (manifest.images?.sizes || [ Infinity ])
		.map(size => size === Infinity ? metadata.width : size)
		.filter(size => size <= metadata.width)

	for (const format of formats) {
		for (const size of truncated) {
			const p = imsrc(ctx, manifest, metadata, filename, format, size)
			promises.push(p)
		}
	}

	const matrix = await Promise.all(promises)
	return { matrix, formats }
}

/* eslint-disable max-params */
async function imsrc (ctx : Compilation, manifest : FrameDefinition, meta : Metadata, filename : string, format : string, size : number) : Promise<string> {
	const timer = new Timer()
	const img = sharp(filename)
	const width = Math.min(size, meta.width)

	const pfx = await prefix(filename)
	const existing = await exists(ctx, pfx, width, format)
	if (existing) {
		ctx.log("Skipping existing image %s", existing)
		return existing
	}

	if (width !== meta.width) {
		img.resize({ width: size })
	}

	if (format === "webp") {
		img.webp({
			quality: quality(manifest, "webp"),
			alphaQuality: quality(manifest, "webp"),
		})
	}

	if (format === "jpeg") {
		img.jpeg({
			progressive: true,
			quality: quality(manifest, "jpeg"),
		})
	}

	const buf = await img.toBuffer()
	const h = await hash(buf)

	const src = `/${impath}/${pfx}/${width}.${h}.${format}`
	await ctx.write(src, buf)

	ctx.log("Resized %s x%s %s (%s)", filename.replace(`${ctx.config.root}/`, ""), width, format, timer)

	return src
}

// Calculate a prefix for the image filename, this will always be the
// same for one image, so different versions of one images sort together.
async function prefix (filename : string) : Promise<string> {
	const h = await hash(filename)
	return h.substring(0, 5)
}

// Check if an image with the specified prefix, size and format already exists in the
// image directory (regardless of hash).
async function exists (ctx : Compilation, pfx : string, size : number | string, format : string) : Promise<?string> {
	if (ctx.config.force) {
		ctx.debug("Not considering existing image %s because force is %s", `${pfx}.${size}`, ctx.config.force)
		return null
	}

	try {
		const files = await fs.readdir(path.join(ctx.config.output, impath, pfx))
		const found = files.find(file => file.startsWith(`${size}.`) && file.endsWith(`.${format}`))
		if (!found) {
			return null
		}

		return `/${impath}/${pfx}/${found}`
	} catch (err) {
		return null
	}
}

function quality (manifest : FrameDefinition, format : ImageFormat) : number {
	if (!manifest.images || !manifest.images.quality) {
		return 85
	}

	if (typeof manifest.images.quality === "number") {
		return manifest.images.quality
	}

	if (format in manifest.images.quality) {
		return manifest.images.quality[format]
	}

	return 85
}
