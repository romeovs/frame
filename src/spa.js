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

	const deduped = {}
	for (const route of routes) {
		deduped[route.id] = {
			id: route.id,
			entrypoint: route.entrypoint,
			name: `Comp${Object.keys(deduped).length + 1}`,
		}
	}

	const rts = {}
	for (const route of routes) {
		rts[route.url] = {
			id: route.id,
			pf: route.propsfile,
		}
	}

	const ast = template.program(`
"use strict"
import React from "react"
import { useRouteMatch } from "react-router"
import { init, lazy, getprops, match } from "${name}"

${fs.existsSync(load) ? `import fallback from "${load}"` : "const fallback = null"}

const info = ROUTES

if (global.IS_SERVER) {
	global.__frame_globals = GLOBALS
	global.__frame_routes = info
} else {
	window.__frame_globals = GLOBALS
	window.__frame_routes = info
}

export default init(async function () {
	const curr = global.IS_SERVER ? null : match(window.location.pathname)

	const [ ${Object.values(deduped).map(comp => comp.name).join(", ")} ] = await Promise.all([
		// create components and preload them
		${Object.values(deduped).map(comp => `
			lazy("${comp.id}", () => import("${comp.entrypoint}"), curr && "${comp.id}" === curr.id),
		`).join("")}

		// preload props
		curr && await getprops(curr.pf, true),
	])

	return function RoutesWrapper () {
		${routes.map(route => `
			const m${route.idx} = useRouteMatch({
				path: "${route.url}",
				exact: true,
			})
		`).join("")}

		${routes.map(route => `
			if (m${route.idx}) {
				return <${deduped[route.id].name} propsfile="${route.propsfile}" />
			}
		`).join("")}

		throw new Error("no route matched")
	}
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
		ROUTES: JSON.stringify(rts),
	})

	const gen = generate(ast)
	console.log(gen.code)

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
	const entrypoint = path.resolve(ctx.config.root, route.import)

	return {
		url: route.url,
		entrypoint,
		propsfile: route.propsfile,
		props: route.props,
		id: await hash(entrypoint),
		idx: index,
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
