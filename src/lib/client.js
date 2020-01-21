import * as React from "react"
import DOM from "react-dom"

import { matchPath } from "react-router"
import { BrowserRouter, Link as RLink } from "react-router-dom"

import { HeadProvider } from "__PACKAGE_NAME__/head"

export { useFrame } from "./use-frame"
export { default as Picture } from "./picture"
export { srcSet } from "./srcset"
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

const modulefetchers = {}

export async function lazy (id : string, fn : () => Promise<Module>, force : boolean) : Promise<React.ComponentType<Props>> {
	let Component = React.lazy(fn)
	if (force) {
		Component = (await fn()).default
	}

	modulefetchers[id] = fn

	return function Wrapper (props : Props) : React.Node {
		const { propsfile, ...rest } = props
		const _props = getprops(propsfile, false)
		return <Component {..._props} {...rest} />
	}
}

type LinkProps = {
	href : string,
	children : React.Node,
	onMouseEnter? : React.HTMLMouseEvent<any> => void,
	...,
}

export function match (url : string) {
	for (const path in window.__frame_routes) {
		const match = matchPath(url, { path, exact: true, strict: false })
		if (match) {
			return {
				...window.__frame_routes[path],
				match,
			}
		}
	}

	return null
}

function preload (href : string) {
	const m = match(href)
	if (!m) {
		return
	}

	fetch(m.pf)
	if (modulefetchers[m.id]) {
		modulefetchers[m.id]()
	}
}

export function Link (props : LinkProps) : React.Node {
	const { href, children, onMouseEnter, ...rest } = props

	function handleEnter (evt) {
		if (onMouseEnter) {
			onMouseEnter(evt)
		}
		preload(href)
	}

	return (
		<RLink
			{...rest}
			to={href}
			onMouseEnter={handleEnter}
		>
			{children}
		</RLink>
	)
}
