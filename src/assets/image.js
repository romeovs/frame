import path from "path"
import sharp from "sharp"
import gip from "cssgip"

import fs from "../fs"
import { hash } from "../hash"
import Timer from "../timer"
import { impath } from "../constants"

import { type Compilation } from "../compilation"
import { type Manifest } from "../manifest"

export type ImageAsset = {
	type : "image",
	id : string,
	width : number,
	height : number,
	formats : string[],
	matrix : string[],
	color : ?string,
	gradient : ?string[],
}

type Metadata = {
	width : number,
}

export async function image (ctx : Compilation, manifest : Manifest, filename : string) : Promise<ImageAsset> {
	const img = sharp(filename)
	const metadata = await img.metadata()

	await fs.mkdir(path.resolve(ctx.config.output, impath), { recursive: true })

	const [
		{ matrix, formats },
		css,
	] = await Promise.all([
		immatrix(ctx, manifest, metadata, filename),
		manifest.images.gip ? ctx.cache([ filename, "gip" ], () => gip(filename)) : {},
	])

	return {
		type: "image",
		id: hash(filename),
		width: metadata.width,
		height: metadata.height,
		format: metadata.format,
		formats,
		matrix,
		color: css.background,
		gradient: css.gradient,
	}
}

async function immatrix (ctx : Compilation, manifest : Manifest, metadata : Metadata, filename : string) : Promise<string[]> {
	const promises = []

	const formats =
		manifest.images.formats[metadata.format]
		|| manifest.images.formats["*"]
		|| [ metadata.format ]

	// Truncate the sizes to the max width
	const truncated = manifest.images.sizes
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

async function imsrc (ctx : Compilation, manifest : Manifest, meta : Metadata, filename : string, format : string, size : number) : Promise<string> {
	const timer = new Timer()
	const img = sharp(filename)
	const width = Math.min(size, meta.width)

	const pfx = await prefix(filename)
	const existing = await exists(ctx, pfx, width, format)
	if (existing) {
		ctx.log("Skipping existing image %s", existing)
		return `/${impath}/${existing}`
	}

	if (width !== meta.width) {
		img.resize({ width: size })
	}

	if (format === "webp") {
		img.webp({
			quality:
				manifest.images?.quality?.webp
				|| manifest.images?.quality
				|| 85,
			alphaQuality:
				manifest.images?.quality?.webp
				|| manifest.images?.quality
				|| 85,
		})
	}

	if (format === "jpeg") {
		img.jpeg({
			progressive: true,
			quality:
				manifest.images?.quality?.jpeg
				|| manifest.images?.quality
				|| 85,
		})
	}

	const buf = await img.toBuffer()
	const h = await hash(buf)

	const src = `/${impath}/${pfx}.${width}.${h}.${format}`
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
async function exists (ctx : Compilation, pfx : string, size : number | string, format : string) : Promise<string> {
	if (ctx.config.force) {
		ctx.debug("Not considering existing image %s because force is %s", `${pfx}.${size}`, ctx.config.force)
		return null
	}

	const files = await fs.readdir(path.join(ctx.config.output, impath))

	return files.find(file => file.startsWith(`${pfx}.${size}.`) && file.endsWith(`.${format}`))
}
