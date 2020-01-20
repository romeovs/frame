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

export async function init (build : () => Promise<React.ComponentType<null>>, Fallback : ?React.ComponentType<mixed>, timeout : number) {
	const Component = await build()

	const comp = (
		<HeadProvider>
			<BrowserRouter>
				<React.Suspense fallback={Fallback ? <Fallback /> : null} ms={timeout}>
					<Component />
				</React.Suspense>
			</BrowserRouter>
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

const cache = {}
async function _get (propsfile : string) : Promise<mixed> {
	const resp = await fetch(propsfile)
	const data = await resp.json()
	cache[propsfile] = data

	return data
}

const promises = {}
export function getprops (propsfile : string, force : boolean = false) : mixed {
	if (!cache[propsfile]) {
		if (!promises[propsfile]) {
			promises[propsfile] = _get(propsfile)
		}

		if (force) {
			return promises[propsfile]
		}

		throw promises[propsfile]
	}

	return cache[propsfile]
}

type Props = {
	propsfile : string,
	...,
}

export async function lazy (fn : () => Promise<Module>, force : boolean) : Promise<React.ComponentType<Props>> {
	let Component = React.lazy(fn)
	if (force) {
		Component = (await fn()).default
	}

	return function Wrapper (props : Props) : React.Node {
		const { propsfile, ...rest } = props
		const _props = getprops(propsfile, false)
		return <Component {..._props} {...rest} />
	}
}
