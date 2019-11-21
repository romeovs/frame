import { mapkv } from "../map"
import { inflate, deflate, type Dictionary } from "./dictionary"
import * as image from "./image"

const custom = {
	image,
}

// Compress a single asset by renaming its keys and well-known values
// using a predefined dictionary.
export function compress (dict : Dictionary, asset : mixed) : mixed {
	if (Array.isArray(asset)) {
		return asset.map(el => compress(dict, el))
	}

	if (typeof asset === "string") {
		return deflate(dict, asset)
	}

	if (typeof asset !== "object" || asset === null) {
		return asset
	}

	const customized =
		typeof asset.type === "string" && asset.type in custom
			? custom[asset.type].compress(asset)
			: asset

	return mapkv(customized, x => typeof x === "string" ? deflate(dict, x) : x)
}

// Deompress a single asset by renaming its keys and well-known values
// using the predefined dictionary.
export function decompress (dict : Dictionary, compressed : mixed) : mixed {
	if (Array.isArray(compressed)) {
		return compressed.map(el => decompress(dict, el))
	}

	if (typeof compressed === "string") {
		return inflate(dict, compressed)
	}

	if (typeof compressed !== "object" || compressed === null) {
		return compressed
	}

	const inflated = mapkv(compressed, x => typeof x === "string" ? inflate(dict, x) : x)

	return (
		typeof inflated.type === "string" && inflated.type in custom
			? custom[inflated.type].decompress(inflated)
			: inflated
	)
}
