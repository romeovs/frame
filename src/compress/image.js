import { impath } from "../constants"
import { type ImageAsset } from "../assets/image"
import { type ImageFormat } from "../config"

type CompressedImage = {
	type : "image",
	id : string,
	width : number,
	height : number,
	matrix : string[],
	color : ?string,
	gradient : ?string[],
}

export function compress (image : ImageAsset) : CompressedImage {
	const { formats, ...rest } = image
	return {
		...rest,
		matrix: image.matrix.map(x => x.replace(`/${impath}/${image.id.substring(0, 5)}/`, "")),
	}
}

export function decompress (image : CompressedImage) : ImageAsset {
	return {
		...image,
		matrix: image.matrix.map(x => `/${impath}/${image.id.substring(0, 5)}/${x}`),
		formats: Array.from(new Set(image.matrix.map(format))),
	}
}

function format (str : string) : ImageFormat {
	const parts = str.split(".")

	// $ExpectError: We want to avoid this check here
	return parts[parts.length - 1]
}
