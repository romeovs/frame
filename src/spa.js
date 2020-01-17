import path from "path"

import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"
import { type Entrypoints } from "./entrypoints"
import { type RouteDef } from "./config"

import { hash } from "./hash"
import { Timer } from "./timer"
import { name } from "./pkg"

import template from "@babel/template"
import generate from "@babel/generator"

// Bundle entrypoints together
export async function spa (ctx : Compilation, manifest : Manifest) : Promise<Entrypoints> {
	const timer = new Timer()
	const fname = path.resolve(ctx.config.root, "spa")

	const cache = {}
	const routes = await Promise.all(manifest.routes.map((route, index) => page(ctx, route, cache)))
	const comps = dedupe(routes)

	const ast = template.program(`
"use strict"
import React from "react"
import { Switch, Route } from "react-router"
import { init } from "${name}"

if (global.IS_SERVER) {
	global.__frame_globals = GLOBALS
} else {
	window.__frame_globals = GLOBALS
}

const lazy = function (fn) {
	const Comp = React.lazy(fn)
	return () => (
		<React.Suspense fallback={null}>
			<Comp />
		</React.Suspense>
	)
}

export default init(async function (props) {
	${comps.map(comp => `
	const ${comp.name} =
		global.IS_SERVER || ${JSON.stringify(comp.urls)}.includes(window.location.pathname)
			? (await import("${comp.entrypoint}")).default
			: lazy(() => import("${comp.entrypoint}"))
	`).join("")}

	return (
		<Switch>
			${routes.map((route, index) => `
				<Route exact path="${route.url}">
					<${route.name} {...props} />
				</Route>
			`.trim()).join("\n")}
		</Switch>
	)
})
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
}

async function page (ctx : Compilation, route : RouteDef, cache : any) : Route {
	const fname = path.resolve(ctx.config.root, route.import)

	const ast = template.program(`
"use strict"
import React from "react"
import Component from "FILE"
const props = PROPS
export default () => <Component {...props} />
		`, {
		sourceMap: true,
		plugins: [
			"jsx",
		],
	})({
		FILE: fname,
		PROPS: JSON.stringify(route.props),
	})

	const gen = generate(ast)
	const id = hash(fname)

	const ep = await ctx.writeCache(`client/${id}.js`, gen.code)
	if (gen.map) {
		await ctx.writeCache(`client/${id}.js.map`, gen.map)
	}

	const suff = cache[ep] || Object.keys(cache).length + 1
	cache[ep] = suff

	return {
		name: `Comp${suff}`,
		url: route.url,
		entrypoint: ep,
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
