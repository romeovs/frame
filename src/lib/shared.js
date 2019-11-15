import React from "react"

export const context = React.createContext({})

export function useFrame () {
	return React.useContext(context)
}
