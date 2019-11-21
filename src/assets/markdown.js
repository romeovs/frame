import Markdown from "markdown-it"
import YAML from "js-yaml"

import { hash } from "../hash"
import fs from "../fs"

import { type Compilation } from "../compilation"
import { type Manifest } from "../manifest"

export type MarkdownAsset = {
	id : string,
	type : "markdown",
	html : string,
	prematter : mixed,
}

export async function markdown (ctx : Compilation, manifest : Manifest, filename : string) : Promise<MarkdownAsset> {
	const content = await fs.readFile(filename, "utf-8")

	const parts = content.split(/^---$/, 1)

	const pre = parts.length === 1 ? null : parts[0]
	const md = parts.length === 1 ? parts[0] : parts.slice(1).join("---")

	const m = new Markdown({
		linkify: true,
		typographer: true,
	})

	const html = m.render(md)

	return {
		type: "markdown",
		id: hash(filename),
		html,
		prematter: pre ? YAML.safeLoad(pre) : {},
	}
}
