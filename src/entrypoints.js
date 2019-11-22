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
	path : string,
}

export type Entrypoints = Entrypoint[]

export async function entrypoints (ctx : Compilation, manifest : Manifest) : Promise<Entrypoints> {
	const timer = new Timer()

	const promises = []
	for (const route of manifest.routes) {
		promises.push(entrypoint(ctx, route.import))
	}

	const res = await Promise.all(promises)
	ctx.log("Built entrypoints (%s)", timer)

	return res
}

async function entrypoint (ctx : Compilation, component : string) : Promise<Entrypoint> {
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

	const ep = await ctx.writeCache(`client/${id}.js`, gen.code)
	if (gen.map) {
		await ctx.writeCache(`client/${id}.js.map`, gen.map)
	}

	return {
		id,
		component,
		path: fname,
		entrypoint: ep,
	}
}
