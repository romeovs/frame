import { impath } from "../constants"
import { type ImageAsset } from "../assets/image"

export function compress (image : ImageAsset) : mixed {
	return {
		...image,
		matrix: image.matrix.map(x => x.replace(`/${impath}/${image.id.substring(0, 5)}/`, "")),
		formats: undefined,
	}
}

export function decompress (image : mixed) : ImageAsset {
	return {
		...image,
		matrix: image.matrix.map(x => `/${impath}/${image.id.substring(0, 5)}/${x}`),
		formats: Array.from(new Set(image.matrix.map(format))),
	}
}

function format (str : string) : string {
	const parts = str.split(".")
	return parts[parts.length - 1]
}
