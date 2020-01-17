import React from "react"

export type Context<Globals> = {
	globals : ?Globals,
}

export function useFrame<T> () : Context<T> {
	if (global.IS_SERVER) {
		return {
			globals: global.__frame_globals,
		}
	} else {
		return {
			globals: window.__frame_globals,
		}
	}
}
