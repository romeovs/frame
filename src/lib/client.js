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

export async function init (build : () => Promise<React.Node>, Fallback : ?React.ComponentType<mixed>, timeout : number) {
	const component = await build()

	const comp = (
		<HeadProvider>
			<React.Suspense fallback={Fallback ? <Fallback /> : null} ms={timeout}>
				<BrowserRouter>
					{component}
				</BrowserRouter>
			</React.Suspense>
		</HeadProvider>
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

function simple (url : string) : string {
	if (url === "/") {
		return url
	}

	return url.replace(/\/*$/g, "")
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
	if (simple(window.location.pathname) === url) {
		return get(fn, propsfile)
	}

	return Promise.resolve(React.lazy(async function () : Promise<Module> {
		return {
			default: await get(fn, propsfile),
		}
	}))
}
