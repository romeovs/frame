import { mapk, mapv } from "./map"
import { impath } from "./constants"

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

	let a = asset

	if ("type" in asset && asset.type === "image") {
		a = {
			...a,
			matrix: a.matrix.map(x => x.replace(`/${impath}/${a.id.substring(0, 5)}/`, "")),
			formats: undefined,
		}
	}

	const r = mapk(a, defl)
	return mapv(r, defl)
}

// Deompress a single asset by renaming its keys and well-known values
// using the predefined dictionary.
export function decompress (asset : CompressedAsset) : Asset {
	if (Array.isArray(asset)) {
		return asset.map(el => decompress(el))
	}
	const r = mapk(asset, infl)
	let a = mapv(r, infl)

	if ("type" in a && a.type === "image") {
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
