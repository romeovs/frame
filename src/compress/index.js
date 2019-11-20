import { mapk, mapv } from "../map"
import { dictionary } from "./dictionary"
import * as image from "./image"

type CompressedAsset = mixed

const strings = [
	// keys
	"id",
	"type",
	"src",
	"href",
	"width",
	"height",
	"formats",
	"matrix",
	"color",
	"gradient",
	"content",
	"names",
	"inline",
	"modules",
	"filename",

	// types
	"image",
	"json",
]


const dict = dictionary(strings)
const custom = {
	image,
}

// Compress a single asset by renaming its keys and well-known values
// using a predefined dictionary.
export function compress (asset : Asset) : CompressedAsset {
	if (Array.isArray(asset)) {
		return asset.map(el => compress(el))
	}

	if (typeof asset !== "object" || asset === null) {
		return asset
	}

	const customized =
		typeof asset === "object" && asset.type in custom
			? custom[asset.type].compress(asset)
			: asset

	const r = mapk(customized, dict.defl)
	return mapv(r, dict.defl)
}

// Deompress a single asset by renaming its keys and well-known values
// using the predefined dictionary.
export function decompress (compressed : mixed) : Asset {
	if (Array.isArray(compressed)) {
		return compressed.map(el => decompress(el))
	}

	if (typeof compressed !== "object" || compressed === null) {
		return compressed
	}

	const r = mapk(compressed, dict.infl)
	const inflated = mapv(r, dict.infl)

	return (
		typeof inflated === "object" && inflated.type in custom
			? custom[inflated.type].decompress(inflated)
			: inflated
	)
}
