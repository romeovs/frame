import path from "path"
import { Route, glob, asset, type RouteDef } from "frame/server"

export default {
	images: {
		sizes: [
			450,
			900,
			1500,
			2400,
			3000,
		],
		formats: {
			"*": [ "jpeg", "webp" ],
			png: [ "png" ],
		},
	},
	async routes () : RouteDef {
		const bars =
			glob("bar/*.yml")
				.map(async function (pth : string) : RouteDef {
					const url = `/bar/${path.basename(pth).replace(".yml", "")}`

					return Route(url, "./components/bar", {
						title: (await asset(pth)).content.title,
					})
				})

		return [
			...await Promise.all(bars),
			Route("/foo", "./components/foo"),
			Route("/", "./components/foo"),
		]
	},
}
