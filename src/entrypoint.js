import path from "path"

import template from "@babel/template"
import generate from "@babel/generator"

import { hash } from "./hash"
import fs from "./fs"

export async function entrypoint (ctx : Compilation, url : string, file : string) {
	const ast = template.program(`
import { init } from "frame"
import Component from "FILE"
init(Component)
		`, {
		plugins: [
			"jsx",
			"dynamicImport",
		],
	})({
		FILE: path.resolve(ctx.config.root, file.replace(/^\//, "")),
	})

	const g = generate(ast)
	const id = hash(g.code)
	const fname = `${id}.js`

	await ctx.writeCache(`client/${fname}`, g.code)

	return id
}
