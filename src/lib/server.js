import * as React from "react"
import { StaticRouter } from "react-router-dom"

import { type RouteDef, type Component, type Routes } from "../config"
import { type Asset, type ImageAsset, type JSONAsset, type YAMLAsset, type MarkdownAsset } from "../assets"
import { type ImageFormat } from "../config"

import { HeadProvider } from "__PACKAGE_NAME__/head"
import { context } from "./use-frame"

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

export function init<T> (build : () => Promise<React.ComponentType<T>>) : () => Promise<[ React.ComponentType<T>, React.Node[]]> {
	return async function () {
		const component = await build()
		const head = []

		function Comp () : React.Node {
			return (
				<context.Provider value={global._frame_context}>
					<StaticRouter location={global._frame_url}>
						<HeadProvider tags={head}>
							{component}
						</HeadProvider>
					</StaticRouter>
				</context.Provider>
			)
		}

		return [ Comp, head ]
	}
}
