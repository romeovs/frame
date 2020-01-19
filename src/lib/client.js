import * as React from "react"
import DOM from "react-dom"
import { BrowserRouter } from "react-router-dom"

import { HeadProvider } from "__PACKAGE_NAME__/head"

export { useFrame } from "./use-frame"
export { default as Picture } from "./picture"
export { srcSet } from "./srcset"
export { Link, Meta, Style, Title } from "./head"
export { slug } from "./slug"

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

export async function init (build : () => Promise<React.Node>) {
	const component = await build()

	const comp = (
		<BrowserRouter>
			<HeadProvider>
				{component}
			</HeadProvider>
		</BrowserRouter>
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

type Module = {
	default : React.ComponentType<mixed>,
}

async function getprops (propsfile : string) : Promise<mixed> {
	const resp = await fetch(propsfile)
	return resp.json()
}

async function get (fn : () => Promise<Module>, propsfile : string) : Promise<React.ComponentType<mixed>> {
	const [ Mod, props ] = await Promise.all([ fn(), getprops(propsfile) ])

	return function ModuleWrapper (rest : mixed) : React.Node {
		return <Mod.default {...props} {...rest} />
	}
}

export function lazy (url : string, fn : () => Promise<Module>, propsfile : string) : Promise<React.ComponentType<mixed>> {
	if (window.location.pathname === url) {
		return get(fn, propsfile)
	}

	const Comp = React.lazy(async () => ({
		default: await get(fn, propsfile),
	}))

	return Promise.resolve(function RouteEntryWrapper (rest : mixed) : React.Node {
		return (
			<React.Suspense fallback={null}>
				<Comp {...rest} />
			</React.Suspense>
		)
	})
}
