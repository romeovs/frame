import { jspath } from "./constants"
import { compress } from "./compress"
import { mapkv } from "./map"

export function props (ctx : Compilation, manifest : Manifest, p : mixed) : Promise<string> {
	const data = {
		p: mapkv(p, v => compress(manifest.dictionary, v)),
		g: mapkv(manifest.globals, v => compress(manifest.dictionary, v)),
	}

	return ctx.write(`/${jspath}/p.json`, JSON.stringify(data), true)
}
