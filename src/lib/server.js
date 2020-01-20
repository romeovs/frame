import * as React from "react"
import { StaticRouter } from "react-router-dom"

import { type RouteDef, type Component, type Routes } from "../config"
import { type Asset, type ImageAsset, type JSONAsset, type YAMLAsset, type MarkdownAsset } from "../assets"
import { type ImageFormat } from "../config"

import { HeadProvider } from "__PACKAGE_NAME__/head"

export { useFrame } from "./use-frame"
export { default as Picture } from "./picture"
export { srcSet } from "./srcset"
export { slug } from "./slug"

export type {
	Asset,
	RouteDef,
	Routes,
	Component,
	JSONAsset,
	YAMLAsset,
	ImageAsset,
	ImageFormat,
	MarkdownAsset,
}

export function glob (...segments : string[]) : string[] {
	return global._frame_glob(...segments)
}

export function asset (path : string) : Promise<Asset> {
	return global._frame_asset(path)
}

export function Route<T> (url : string, component : Component<T>, props : T) : RouteDef<T> {
	return {
		url,
		import: "TODO",
		id: "TODO",
		props,
	}
}

export function init<T> (build : () => Promise<React.ComponentType<null>>) : (string) => Promise<[ React.ComponentType<T>, React.Node[]]> {
	return async function (url : string) : Promise<[ React.ComponentType<T>, React.Node[]]> {
		const Component = await build()
		const head = []

		function Comp () : React.Node {
			return (
				<HeadProvider tags={head}>
					<StaticRouter location={url}>
						<Component />
					</StaticRouter>
				</HeadProvider>
			)
		}

		return [ Comp, head ]
	}
}

type Module = {
	default : React.ComponentType<mixed>,
}

export function getprops (propsfile : string) : mixed {
	return global.__frame_props[propsfile]
}

export async function lazy (fn : () => Promise<Module>) : Promise<React.ComponentType<mixed>> {
	const Mod = await fn()
	return function RouteEntryWrapper (props : mixed) : React.Node {
		const { propsfile, ...rest } = props
		const _props = getprops(propsfile)
		return <Mod.default {..._props} {...rest} />
	}
}
