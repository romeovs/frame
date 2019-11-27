import React from "react"

export type Context<Globals> = {
	globals : ?Globals,
}

type AnyContext = Context<*>

export const context = React.createContext<AnyContext>({
	globals: null,
})

export function useFrame<T> () : Context<T> {
	// $ExpectError
	return React.useContext<T>(context)
}
