import * as React from "react"
import { HeadProvider } from "react-head"

import { type RouteDef } from "../config"
import { type Asset } from "../assets"
import { type RouteProps } from "../config"

import { context } from "./shared"
export { useFrame } from "./shared"

export type { Asset, RouteDef }

export function glob (...segments : string[]) : string[] {
	return global._frame_glob(...segments)
}

export function asset (path : string) : Promise<Asset> {
	return global._frame_asset(path)
}

export function Route (url : string, component : string, props : RouteProps = {}) : RouteDef {
	return {
		url,
		component,
		props,
	}
}

export function init<T> (Component : React.ComponentType<T>) : [ React.ComponentType<T>, React.Node[]] {
	const head = []
	function Comp (props : T) : React.Node {
		return (
			<context.Provider value={global._frame_context}>
				<HeadProvider headTags={head}>
					<Component {...props} />
				</HeadProvider>
			</context.Provider>
		)
	}

	return [ Comp, head ]
}
