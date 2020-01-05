import fs from "../fs"
import { hash } from "../hash"

import { type Compilation } from "../compilation"
import { type Manifest } from "../manifest"

export type TextAsset = {
	id : string,
	type : "text",
	content : string,
}

export async function text (ctx : Compilation, manifest : Manifest, filename : string) : Promise<TextAsset> {
	const content = await fs.readFile(filename, "utf-8")

	return {
		type: "text",
		id: hash(filename),
		content,
	}
}
