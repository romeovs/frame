import * as React from "react"
import path from "path"
import { Route, glob, asset, type Routes, type RouteDef } from "@romeovs/frame/server"

import { type BarProps } from "./components/bar"

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
	hostname: "https://www.example.com",
	security: {
		contact: "https://www.example.com/ok",
	},
	analytics: {
		fathom: {
			host: "example.com",
			id: "1234",
		},
	},
	loadTimeout: 500,
	async routes () : Promise<Routes> {
		const bars =
			glob("bar/*.yml")
				.map(async function (pth : string) : Promise<RouteDef<BarProps>> {
					const url = `/bar/${path.basename(pth).replace(".yml", "")}`
					const info = await asset(pth)

					if (info.type !== "yaml") {
						throw Error("Unexpected asset type")
					}

					if (typeof info.content !== "object" || !info.content) {
						throw Error("Need object with keys")
					}

					if (!("title" in info.content) || typeof info.content.title !== "string") {
						throw Error("Missing title in content")
					}

					return Route(url, import("./components/bar"), {
						title: info.content.title,
					})
				})

		return [
			...await Promise.all(bars),
			Route("/foo", import("./components/foo"), { init: 1 }),
			Route("/", import("./components/foo"), { init: 0 }),
		]
	},
}
