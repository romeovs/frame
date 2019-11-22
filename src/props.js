import { jspath } from "./constants"
import { compress } from "./compress"
import { mapkv } from "./map"

import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"


export function props<T> (ctx : Compilation, manifest : Manifest, p : T) : Promise<string> {
	const data = {
		p: typeof p !== "object" || !p ? {} : mapkv(p, v => compress(manifest.dictionary, v)),
		g: mapkv(manifest.globals, v => compress(manifest.dictionary, v)),
	}

	return ctx.write(`/${jspath}/p.json`, JSON.stringify(data), true)
}
