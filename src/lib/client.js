import React from "react"
import DOM from "react-dom"
import { decompress } from "../compress"

export async function init (Component) {
	console.log("This page is rendered with Frame.js")

	const props = await getprops()
	console.log("props", props)

	DOM.render(
		<Component {...props} />,
		document.getElementById("app"),
	)
}

async function getprops () : {[string] : mixed } {
	const url = document.getElementById("frameprops").href
	const resp = await fetch(url)
	return decompress(await resp.json())
}
