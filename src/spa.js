import path from "path"
import fs from "fs"

import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"
import { type Entrypoints } from "./entrypoints"
import { type RouteDef } from "./config"

import { hash } from "./hash"
import { Timer } from "./timer"
import { name } from "./pkg"
import { props } from "./props"

import template from "@babel/template"
import generate from "@babel/generator"

// Bundle entrypoints together
export async function spa (ctx : Compilation, manifest : Manifest) : Promise<Entrypoints> {
	const timer = new Timer()
	const fname = path.resolve(ctx.config.root, "spa")

	const routes = await Promise.all(manifest.routes.map((route, index) => page(ctx, route, index)))

	const propfiles = {}
	for (const route of routes) {
		propfiles[route.propsfile] = route.props
	}

	global.__frame_props = propfiles

	const load = path.resolve(ctx.config.root, "_loading.js")

	const ast = template.program(`
"use strict"
import React from "react"
import { Switch, Route } from "react-router"
import { init, lazy } from "${name}"

${fs.existsSync(load) ? `import fallback from "${load}"` : "const fallback = null"}

if (global.IS_SERVER) {
	global.__frame_globals = GLOBALS
} else {
	window.__frame_globals = GLOBALS
}

export default init(async function (props) {
	const [ ${routes.map(route => route.name).join(", ")} ] = await Promise.all([
	${routes.map(route => `
		 lazy("${route.url}", () => import("${route.entrypoint}"), "${route.propsfile}", fallback, ${manifest.loadTimeout})
	`).join(",\n")}
	])

	return (
		<Switch>
			${routes.map((route, index) => `
				<Route exact path="${route.url}">
					<${route.name} {...props} />
				</Route>
			`.trim()).join("\n")}
		</Switch>
	)
}, fallback, ${manifest.loadTimeout})
	`, {
		sourceMap: true,
		plugins: [
			"jsx",
			"dynamicImport",
		],
	})({
		IS_SERVER: "IS_SERVER",
		GLOBALS: JSON.stringify(manifest.globals),
	})

	const gen = generate(ast)

	const ep = await ctx.writeCache(`client/spa.js`, gen.code)
	if (gen.map) {
		await ctx.writeCache(`client/spa.js.map`, gen.map)
	}

	// const fname = path.resolve(ctx.config.root, component)
	ctx.log("Built entrypoints (%s)", timer)

	return [{
		id: "spa",
		component: "",
		path: fname,
		entrypoint: ep,
	}]
}

type Route = {
	name : string,
	url : string,
	entrypoint : string,
	propsfile : string,
}

async function page (ctx : Compilation, route : RouteDef, index : number) : Route {
	const fname = path.resolve(ctx.config.root, route.import)
	const propsfile = await props(ctx, route.props)

	return {
		name: `Comp${index}`,
		url: route.url,
		entrypoint: path.resolve(ctx.config.root, route.import),
		propsfile,
		props: route.props,
	}
}

type Component = {
	name : string,
	urls : string[],
	entrypoint : string,
}

function dedupe (routes : Route[]) : Route[] {
	const byName = {}
	for (const route of routes) {
		byName[route.name] = byName[route.name] || {
			name: route.name,
			urls: [],
			entrypoint: route.entrypoint,
		}

		byName[route.name].urls.push(route.url)
	}

	const res = []
	for (const name in byName) {
		res.push(byName[name])
	}

	return res
}
