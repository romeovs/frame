import { mapk, mapv } from "../map"
import { impath } from "../constants"
import { dictionary } from "./dictionary"

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

// Compress a single asset by renaming its keys and well-known values
// using a predefined dictionary.
export function compress (asset : Asset) : CompressedAsset {
	if (Array.isArray(asset)) {
		return asset.map(el => compress(el))
	}

	if (typeof asset !== "object" || asset === null) {
		return asset
	}

	let a = asset

	if (typeof asset === "object" && "type" in asset && asset.type === "image") {
		a = {
			...a,
			matrix: a.matrix.map(x => x.replace(`/${impath}/${a.id.substring(0, 5)}/`, "")),
			formats: undefined,
		}
	}

	const r = mapk(a, dict.defl)
	return mapv(r, dict.defl)
}

// Deompress a single asset by renaming its keys and well-known values
// using the predefined dictionary.
export function decompress (asset : CompressedAsset) : Asset {
	if (Array.isArray(asset)) {
		return asset.map(el => decompress(el))
	}

	if (typeof asset !== "object" || asset === null) {
		return asset
	}

	const r = mapk(asset, dict.infl)
	let a = mapv(r, dict.infl)

	if (typeof a === "object" && "type" in a && a.type === "image") {
		a = {
			...a,
			matrix: a.matrix.map(x => `/${impath}/${a.id.substring(0, 5)}/${x}`),
			formats: Array.from(new Set(a.matrix.map(format))),
		}
	}

	return a
}

function format (str : string) : string {
	const parts = str.split(".")
	return parts[parts.length - 1]
}
