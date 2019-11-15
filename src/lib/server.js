import path from "path"
import Glob from "glob"
import { type RouteDef } from "../manifest"

export function glob (...segments : string[]) : string[] {
	const pat = path.join(...segments)
	global._frame_glob(pat)
	return Glob.sync(pat)
}

export function asset (path : string) : mixed {
	global._frame_asset(path)
	return []
}

export function Route (component : string, props : {[string] : mixed}) : RouteDef {
	return {
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
	return Component
}
