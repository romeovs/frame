import * as React from "react"
import { HeadProvider } from "react-head"

import { type RouteDef } from "../manifest"
import { type Asset } from "../assets"

import { context } from "./shared"
export { useFrame } from "./shared"

export type { Asset }

export function glob (...segments : string[]) : string[] {
	return global._frame_glob(...segments)
}

export function asset (path : string) : mixed {
	return global._frame_asset(path)
}

export function Route (url : string, component : string, props : {[string] : mixed} = {}) : RouteDef {
	return {
		url,
		component,
		props,
	}
}

export function combine (acc : {[string] : RouteDef }, next : {[string] : RouteDef }) : {[string] : RouteDef } {
	return {
		...acc,
		...next,
	}
}

export function init (Component) {
	const head = []
	const Comp = function (props) {
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
