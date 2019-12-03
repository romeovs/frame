import { useEffect } from "react"

type Keys ={
	[number] : () => void,
	...,
}

export function useKeys (handlers : Keys, disable : boolean = false) {
	useEffect(function () : () => void {
		function handleKeyDown (evt : SyntheticKeyboardEvent<typeof window>) {
			if (disable) {
				return
			}

			const fn = handlers[evt.key]
			if (fn) {
				evt.preventDefault()
				fn()
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [ disable, handlers ])
}
