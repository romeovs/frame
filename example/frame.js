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
	dictionary: [
		"title",
	],
	async routes () : Promise<RouteDef[]> {
		const bars =
			glob("bar/*.yml")
				.map(async function (pth : string) : Promise<RouteDef> {
					const url = `/bar/${path.basename(pth).replace(".yml", "")}`
					const info = await asset(pth)

					if (info.type !== "yaml") {
						throw Error("Unexpected asset type")
					}

					// $ExpectError: TODO make Route generic
					return Route(url, "./components/bar", info.content)
				})

		return [
			...await Promise.all(bars),
			Route("/foo", "./components/foo"),
			Route("/", "./components/foo"),
		]
	},
}
