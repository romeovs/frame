import fs from "../fs"
import { hash } from "../hash"

import { type Compilation } from "../compilation"
import { type Manifest } from "../manifest"

export type HTMLAsset = {
	id : string,
	type : "html",
	content : string,
}

export async function html (ctx : Compilation, manifest : Manifest, filename : string) : Promise<HTMLAsset> {
	const content = await fs.readFile(filename, "utf-8")

	return {
		type: "html",
		id: hash(filename),
		content,
	}
}
