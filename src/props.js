import { jspath } from "./constants"
import { compress } from "./compress"
import { mapkv } from "./map"

import { type Compilation } from "./compilation"
import { type Dictionary } from "./compress"

export function props<T> (ctx : Compilation, dictionary : Dictionary, _props : T) : Promise<string> {
	const data = typeof _props === "object" && _props ? _props : {}
	const compressed = mapkv(data, v => compress(dictionary, v))

	return ctx.write(`/${jspath}/p.json`, JSON.stringify(compressed), true)
}
