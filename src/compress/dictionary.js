
// The alphabet that will be used to translate keys
const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHIJKMNOPQRSTUVWXYZ"

export function dictionary (strings : string[]) : Dictionary {
	if (strings.length > alphabet.length) {
		throw new Error("Compression alphabet is too short")
	}

	const forwards = {}
	const reverse = {}

	for (const i in strings) {
		const from = strings[i]
		const to = alphabet[i]

		if (from in forwards) {
			throw new Error(`Duplicate key in dictionary: ${from}`)
		}

		forwards[from] = to
		reverse[to] = from
	}

	return {
		// The alphabet
		alphabet: alphabet.substring(0, strings.length - 1),

		// Deflate the string by looking up the compressed symbol in the dictionary
		defl (str : string) : string {
			return forwards[str] || str
		},

		// Inflate the compressed string by looking up the symbol in the dictionary
		infl (sym : string) : string {
			return reverse[sym] || sym
		},
	}
}
