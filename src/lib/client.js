import * as React from "react"
import DOM from "react-dom"
import { HeadProvider } from "react-head"

import { decompress } from "../compress"
import { mapkv } from "../map"
import { context } from "./shared"

export { useFrame } from "./shared"
export { default as Picture } from "./picture"
export { srcSet } from "./srcset"

import { type Asset, type ImageAsset, type JSONAsset, type YAMLAsset, type MarkdownAsset } from "../assets"
import { type ImageFormat } from "../config"

export type {
	Asset,
	JSONAsset,
	YAMLAsset,
	ImageAsset,
	MarkdownAsset,
	ImageFormat,
}


const dictionary = global.DICTIONARY || []

export async function init (Component : React.ComponentType<mixed>, dev : boolean) {
	const { g, p } = await getlink("frameprops")
	if (typeof g !== "object" || !g || typeof p !== "object" || !p) {
		throw Error("Props and globals should be objects")
	}

	const props = mapkv(p, v => decompress(dictionary, v))
	const globals = mapkv(g, v => decompress(dictionary, v))

	const { key, ref, ...rest } = props

	const comp = (
		<context.Provider value={{ globals }}>
			<HeadProvider>
				<Component {...rest} />
			</HeadProvider>
		</context.Provider>
	)

	const app = document.getElementById("app")
	if (!app) {
		throw Error("<div id=\"app\"> is missing")
	}

	if (global.DEV === "development") {
		/* eslint-disable no-console */
		console.log("This page is rendered with Frame.js")
		DOM.render(comp, app)
	} else {
		DOM.hydrate(comp, app)
	}
}

async function getlink (id : string) : Promise<Object> {
	const el = document.getElementById(id)
	if (!(el instanceof HTMLLinkElement) || !el.href) {
		return {}
	}

	const resp = await fetch(el.href)
	return resp.json()
}
