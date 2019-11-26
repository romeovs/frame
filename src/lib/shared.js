import React from "react"

export type Context<Globals> = {
	globals : Globals,
}

const defaults : Context<{}> = {
	globals: {},
}

/* eslint-disable no-extra-parens */
export const context = React.createContext<Context<{}>>(defaults)

export function useFrame<T> () : Context<T> {
	return React.useContext(context)
}
