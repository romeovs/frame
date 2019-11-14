import React from "react"
import DOM from "react-dom"
import { decompress } from "../compress"

export async function init (Component, dev) {
	const props = await getprops()

	if (process.env.NODE_ENV === "development") {
		console.log("This page is rendered with Frame.js")
		DOM.render(
			<Component {...props} />,
			document.getElementById("app"),
		)
	} else {
		DOM.hydrate(
			<Component {...props} />,
			document.getElementById("app"),
		)
	}
}

async function getprops () : {[string] : mixed } {
	const url = document.getElementById("frameprops").href
	const resp = await fetch(url)
	return decompress(await resp.json())
}
