import YAML from "js-yaml"

import { type Compilation } from "../compilation"
import fs from "../fs"

import { type Asset } from "."

export default async function yaml (ctx : Compilation, _ : Manifest, filename : string) : Asset {
	const content = await fs.readFile(filename)
	return {
		type: "json",
		filename,
		content: YAML.safeLoad(content),
	}
}
