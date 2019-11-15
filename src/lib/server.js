import * as React from "react"
import path from "path"
import Glob from "glob"
import { HeadProvider } from "react-head"

import { type RouteDef } from "../manifest"
import { context } from "./shared"
export { useFrame } from "./shared"

export function glob (...segments : string[]) : string[] {
	const pat = path.join(...segments)
	global._frame_glob(pat)
	return Glob.sync(pat)
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
