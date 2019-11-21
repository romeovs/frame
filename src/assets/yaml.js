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

export async function yaml (ctx : Compilation, _ : Manifest, filename : string) : Promise<YAMLAsset> {
	const content = await fs.readFile(filename, "utf-8")
	return {
		type: "yaml",
		id: hash(filename),
		content: YAML.safeLoad(content),
	}
}
