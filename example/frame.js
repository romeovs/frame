import path from "path"

import React from "react"
import { glob, asset, combine, Component } from "frame"

const Bar = Component(() => import("./components/bar"))
const Foo = Component(() => import("./components/foo"))

const bars =
	glob(__dirname, "bar/*.yml")
		.map(function (pth : string) : {[string] : React.Node} {
			const content = asset(pth)
			const url = `/bar/${path.basename(pth).replace(".yml", "")}`
			return {
				[url]: <Bar content={content} />,
			}
		})

export default {
	...combine(bars),
	"/foo": <Foo />,
}
