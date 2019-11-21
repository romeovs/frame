import React from "react"
import { type Globals } from "../config"

export type Context = {
	globals : Globals,
}

const defaults : Context = {
	globals: {},
}

/* eslint-disable no-extra-parens */
export const context = React.createContext<Context>(defaults)

export function useFrame () : Context {
	return React.useContext(context)
}
