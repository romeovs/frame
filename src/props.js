import { jspath } from "./constants"
import { compress } from "./compress"
import { mapkv } from "./map"

import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"


export function props<T> (ctx : Compilation, p : T) : Promise<string> {
	return ctx.write(`/${jspath}/p.json`, JSON.stringify(p), true)
}
