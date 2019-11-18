import YAML from "js-yaml"

import { hash } from "../hash"
import fs from "../fs"

import { type Compilation } from "../compilation"
import { type Manifest } from "../manifest"

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
