import path from "path"
import { Route, glob, asset, combine, type RouteDef } from "frame/server"

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
	routes () : {[string] : RouteDef } {
		const bars =
			glob(__dirname, "bar/*.yml")
				.map(function (pth : string) : {[string] : RouteDef } {
					const url = `/bar/${path.basename(pth).replace(".yml", "")}`
					const content = asset(pth)

					return {
						[url]: Route("./components/bar", { content }),
					}
				})
				.reduce(combine, {})

		return {
			...bars,
			"/foo": Route("./components/foo", {}),
		}
	},
}
