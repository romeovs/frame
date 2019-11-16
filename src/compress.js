import { mapk, mapv } from "./map"

type CompressedAsset = mixed

const strings = [
	// keys
	"id",
	"type",
	"src",
	"href",
	"width",
	"height",
	"format",
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
	"javascript",
	"stylesheet",
	"image",
	"json",
]

const alphabet = "abcdefghijkmnopqrstuvwxyz"

// Build compression dictionary dynamically
const dictionary = {}
const reverse = {}

if (strings.length > alphabet.length) {
	throw new Error("Compression alphabet is too short")
}

for (const i in strings) {
	const from = strings[i]
	const to = alphabet[i]

	if (dictionary[from]) {
		throw new Error(`Duplicate key in dictionary: ${from}`)
	}

	dictionary[from] = to
	reverse[to] = from
}

function defl (key : string) : string {
	return dictionary[key] || key
}

// Rename keys to original names
function infl (key : string) : string {
	return reverse[key] || key
}

// Compress a single asset by renaming its keys and well-known values
// using a predefined dictionary.
export function compress (asset : Asset) : CompressedAsset {
	if (Array.isArray(asset)) {
		return asset.map(el => compress(el))
	}
	const r = mapk(asset, defl)
	return mapv(r, defl)
}

// Deompress a single asset by renaming its keys and well-known values
// using the predefined dictionary.
export function decompress (asset : CompressedAsset) : Asset {
	if (Array.isArray(asset)) {
		return asset.map(el => decompress(el))
	}
	const r = mapk(asset, infl)
	return mapv(r, infl)
}

// Compress all assets.
export function compressAll (assets : Assets) : Assets {
	const r = mapv(assets, ({ id, ...asset }) => asset)
	return mapv(r, compress)
}

// Decompress all assets.
export function decompressAll (assets : Assets) : Assets {
	const r = mapv(assets, decompress)
	for (const id in r) {
		r[id].id = id
	}

	return r
}
