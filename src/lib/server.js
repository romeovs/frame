import * as React from "react"


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

export function init<T> (C : React.ComponentType<T>) : () => [ React.ComponentType<T>, React.Node[]] {
	return function () {
		const head = []

		function Comp (props : T) : React.Node {
			return (
				<context.Provider value={global._frame_context}>
					<HeadProvider tags={head}>
						<C {...props} />
					</HeadProvider>
				</context.Provider>
			)
		}

		return [ Comp, head ]
	}
}
