import path from "path"
import * as React from "react"
import Glob from "glob"

export function glob (...segments : string[]) : string[] {
	const pat = path.join(...segments)
	return Glob.sync(pat)
}

export function asset (path : string) : mixed {
	// TODO
	// global._frame_asset(path)
	return []
}

export function Component (fn : () => Promise<React.Component>) : React.Node {
	return React.lazy(fn)
}

export function combine (objs : {[string] : mixed }[]) : {[string] : mixed } {
	let r = {}
	for (const obj of objs) {
		r = { ...r, ...obj }
	}

	return r
}
