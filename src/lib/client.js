import React from "react"
import DOM from "react-dom"
import { HeadProvider } from "react-head"

import { decompress } from "../compress"
import { mapv } from "../map"
import { context } from "./shared"

export { useFrame } from "./shared"

export async function init (Component, dev) {
	const [ cprops, globals ] = await Promise.all([
		getlink("frameprops"),
		getlink("frameglobals"),
	])

	const props = mapv(cprops, v => decompress(v))
	const ctx = { globals }
	const comp = (
		<context.Provider value={ctx}>
			<HeadProvider>
				<Component {...props} />
			</HeadProvider>
		</context.Provider>
	)

	if (process.env.NODE_ENV === "development") {
		console.log("This page is rendered with Frame.js")
		DOM.render(comp, document.getElementById("app"))
	} else {
		DOM.hydrate(comp, document.getElementById("app"))
	}
}

async function getlink (id : string) : {[string] : mixed } {
	const url = document.getElementById(id)?.href
	if (!url) {
		return {}
	}

	const resp = await fetch(url)
	return decompress(await resp.json())
}

