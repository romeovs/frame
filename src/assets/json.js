import fs from "../fs"
import { hash } from "../hash"

import { type Compilation } from "../compilation"
import { type Manifest } from "../manifest"

export type JSONAsset = {
	type : "json",
	id : string,
	content : mixed,
}

export async function json (ctx : Compilation, _ : Manifest, filename : string) : Promise<JSONAsset> {
	const content = await fs.readFile(filename)
	return {
		type: "json",
		id: hash(filename),
		content: JSON.parse(content),
	}
}
