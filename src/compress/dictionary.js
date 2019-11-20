// Dictionary is the dictionary to compress strings from
export type Dictionary = string[]

// Symbol is a compressed string
type Symbol = string

export const full = "abcdefghijkmnopqrstuvwxyzABCDEFGHIJKMNOPQRSTUVWXYZ"

// The alphabet that will be used to translate keys
const alphabet = Array.from(global.ALPHABET || full)

export function deflate (dict : Dictionary, string : string) : Symbol {
	const index = dict.indexOf(string)
	return index === -1 ? string : alphabet[index] || string
}

export function inflate (dict : Dictionary, symbol : Symbol) : string {
	const index = alphabet.indexOf(symbol)
	return index === -1 ? symbol : dict[index] || symbol
}
