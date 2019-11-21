import React from "react"
import { type Globals } from "../config"

export type Context = {
	globals : Globals,
}

export const context = React.createContext({
	globals: {},
})

export function useFrame () : Context {
	return React.useContext(context)
}
