import YAML from "js-yaml"

import { type Compilation } from "../compilation"
import { hash } from "../hash"
import fs from "../fs"

export type YAMLAsset = {
	type : "yaml",
	id : string,
	content : mixed,
}

export async function yaml (ctx : Compilation, _ : Manifest, filename : string) : Asset {
	const content = await fs.readFile(filename)
	return {
		type: "json",
		id: hash(filename),
		content: YAML.safeLoad(content),
	}
}
