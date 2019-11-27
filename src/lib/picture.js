import * as React from "react"

import { type ImageAsset } from "../assets"
import { type ImageFormat } from "../config"

import { srcSet } from "./srcset"

type Props = {
	// The image to get the sources from
	image : ImageAsset,

	// The sizes prop to pass to the source and img tags
	sizes : string,

	// What direction to pick the srcSet in
	dimension? : "w" | "h",

	// The format to use for the fallback img
	fallbackFormat? : ImageFormat,

	...,
}

function Picture (props : Props) : React.Node {
	const {
		image,
		sizes,
		dimension = "w",
		fallbackFormat = "jpeg",
		...rest
	} = props

	if (!image) {
		// Render empty image if no src is set
		return (
			<picture {...rest}>
				<img sizes={sizes} />
			</picture>
		)
	}

	const fallback = srcSet[dimension](image, fallbackFormat)
	const sources =
		image.formats
			.filter(t => t !== fallbackFormat)
			.map(format => (
				<source
					key={format}
					type={`image/${format}`}
					{...srcSet[dimension](image, format)}
					sizes={sizes}
				/>
			))

	return (
		<picture {...rest}>
			{sources}
			<img {...fallback} sizes={sizes} />
		</picture>
	)
}

export default React.memo<Props>(Picture)