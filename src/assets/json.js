import fs from "../fs"
import { type Compilation } from "../compilation"

import { type Asset } from "."


export default async function (ctx : Compilation, _ : Manifest, filename : string) : Promise<Asset> {
	const content = await fs.readFile(filename)
	return {
		content: JSON.parse(content),
		type: "json",
	}
}
