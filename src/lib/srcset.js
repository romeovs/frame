import { type ImageAsset } from "../assets"
import { type ImageFormat } from "../config"

type ImageInfo = {
	url : string,
	width : number,
	height : number,
	format : ImageFormat,
}

type Orientation = {
	bySize : (a : ImageInfo, b : ImageInfo) => number,
	toSrc : ImageInfo => string,
}

type SrcSet = {
	src : string,
	srcSet : string,
}

/**
 * srcSet gets a minimal srcSet from the image.
 */
const mkSrcSet = (orientation : Orientation) => function srcSet (image : ImageAsset, format : ?ImageFormat) : SrcSet {
	const infos : ImageInfo[] = []
	for (const url of image.matrix) {
		const i = info(image, url)
		if (i) {
			infos.push(i)
		}
	}
	infos.sort(orientation.bySize)

	const srces =
		format
			? infos.filter(inf => inf.format === format)
			: infos

	return {
		src: srces[srces.length - 1]?.url,
		srcSet: srces.map(orientation.toSrc).join(", "),
	}
}

const regex = /\/[^./]+\/(\d+)\.[^.]+\.(jpeg|webp|png|tiff)/

/**
 * info parses some image metadata from the image url.
 *
 * @example
 *   const url = "xyz.2000.qrs.jpeg"
 *   info(url) === { width: 2000, format: "jpeg", url }
 */
function info (image : ImageAsset, url : string) : ?ImageInfo {
	const m = regex.exec(url)
	if (!m) {
		return null
	}

	const width = parseInt(m[1], 10)

	return {
		url,
		// $ExpectError: We want to avoid including validation on ImageFormat here.
		format: m[2],
		width,
		height: Math.ceil(width / image.width * image.height),
	}
}

type SrcSetter = (ImageAsset, ?ImageFormat) => SrcSet

type SrcSetters = {
	w : SrcSetter,
	h : SrcSetter,
}

export const srcSet : SrcSetters = {
	w: mkSrcSet({
		bySize (a : ImageInfo, b : ImageInfo) : number {
			return Math.sign(a.width - b.width)
		},
		toSrc (inf : ImageInfo) : string {
			return `${inf.url} ${inf.width}w`
		},
	}),
	h: mkSrcSet({
		bySize (a : ImageInfo, b : ImageInfo) : number {
			return Math.sign(a.height - b.height)
		},
		toSrc (inf : ImageInfo) : string {
			return `${inf.url} ${inf.height}h`
		},
	}),
}
