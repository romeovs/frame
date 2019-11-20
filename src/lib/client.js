import React from "react"
import DOM from "react-dom"
import { HeadProvider } from "react-head"

import { decompress } from "../compress"
import { mapv } from "../map"
import { context } from "./shared"

export { useFrame } from "./shared"

import { type Asset } from "../assets"
export type { Asset }


export async function init (Component : React.AbstractComponent, dev : boolean) {
	const {
		p: compressedProps,
		g: compressedGlobals,
	} = await getlink("frameprops")

	const props = mapv(compressedProps, v => decompress(v))
	const globals = mapv(compressedGlobals, v => decompress(v))
	const comp = (
		<context.Provider value={{ globals }}>
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
	return await resp.json()
}
