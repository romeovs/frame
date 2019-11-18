import path from "path"

import template from "@babel/template"
import generate from "@babel/generator"

import { hash } from "./hash"
import { Timer } from "./timer"

import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"

export type Entrypoint = {
	id : string,
	component : string,
	entrypoint : string,
}

export type Entrypoints = Entrypoint[]

export async function entrypoints (ctx : Compilation, manifest : Manifest) : Entrypoints {
	const timer = new Timer()

	const promises = []
	for (const url in manifest.routes) {
		const { component } = manifest.routes[url]
		promises.push(entrypoint(ctx, component))
	}

	return await Promise.all(promises)

	ctx.log("Built entrypoints (%s)", timer)

	return res
}

async function entrypoint (ctx : Compilation, component : string) : Entrypoint {
	const fname = path.resolve(ctx.config.root, component)

	const ast = template.program(`
"use strict"
import { init } from "frame"
import Component from "FILE"
export default init(Component)
		`, {
		sourceMap: true,
		plugins: [
			"jsx",
			"dynamicImport",
		],
	})({
		FILE: fname,
	})

	const gen = generate(ast)
	const id = hash(fname)

	const entrypoint = await ctx.writeCache(`client/${id}.js`, gen.code)
	if (gen.map) {
		await ctx.writeCache(`client/${id}.js.map`, gen.map)
	}

	return {
		id,
		component,
		path: fname,
		entrypoint,
	}
}
