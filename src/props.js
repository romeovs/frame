import { jspath } from "./constants"
import { compress } from "./compress"
import { mapv } from "./map"

export function props (ctx : Compilation, manifest : Manifest, p : mixed) : Promise<string> {
	const data = {
		p: mapv(p, v => compress(v)),
		g: mapv(manifest.globals, v => compress(v)),
	}

	return ctx.write(`/${jspath}/p.json`, JSON.stringify(data), true)
}
