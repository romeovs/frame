type Dict = $ReadOnly<{
	[string] : mixed,
	...,
}>

// Map the keys of an Object using fn.
// The function takes arguments fn(key, value, dict).
export function mapk (dict : Dict, fn : (string, mixed, Dict) => string) : Dict {
	const res = {}
	for (const key in dict) {
		const value = dict[key]
		res[fn(key, value, dict)] = dict[key]
	}

	return res
}

// Map the values of an Object using fn.
// The function takes arguments fn(value, key, dict).
export function mapv (dict : Dict, fn : (mixed, string, Dict) => mixed) : Dict {
	const res = {}
	for (const key in dict) {
		const value = dict[key]
		res[key] = fn(value, key, dict)
	}

	return res
}

// Map both the keys and the values of an Object with the same fn.
// The function takes arguments fn(key or value, dict).
export function mapkv (dict : Dict, fn : (mixed, Dict) => mixed) : Dict {
	const res = {}
	for (const key in dict) {
		const value = dict[key]
		const k = fn(key, dict)

		res[String(k)] = fn(value, dict)
	}

	return res
}
