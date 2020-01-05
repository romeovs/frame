import fs from "../fs"
import { hash } from "../hash"

import { type Compilation } from "../compilation"
import { type Manifest } from "../manifest"

export type PDFAsset = {
	id : string,
	type : "pdf",
	url : string,
}

export async function pdf (ctx : Compilation, manifest : Manifest, filename : string) : Promise<PDFAsset> {
	const content = await fs.readFile(filename)
	const id = hash(filename)
	const url = await ctx.write(id, content, true)

	return {
		type: "pdf",
		id,
		url,
	}
}
