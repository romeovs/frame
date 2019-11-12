import path from "path"

import * as React from "react"

import { type Compilation } from "./compilation"
import { server } from "./server"
import { html } from "./html"
import { client } from "./client"
import { entrypoint } from "./entrypoint"
import { system } from "./system"
import { compress } from "./compress"

type Route = {
	// The url of the route
	url : string,

	// The props given to the route
	props : {[string] : mixed },

	// The assets consumed by the route
	assets : string[],

	// The component that renders the route
	component : React.AbstractComponent,

	// The name of the js entrypoint
	entryid : string,

	// Name of the js entrypoint
	jsfile? : string,

	// Name of the mjs entrypoint
	mjsfile? : string,
}

type Shared = {
	css : string,
	cssfile : string,
	systemfile : string,
}

export async function build (ctx : Compilation) {
	const f = await server(ctx)

	ctx.log("Determining routes")
	const routes = await import(f)

	const res : Route[] = []
	const promises = []

	const css = ctx.read(ctx.cachedir, "server/frame.css")
	const cssfile = ctx.write("/main.css", await css, true)
	const sys = system(ctx)

	// Copy the css map file
	promises.push(ctx.copy(path.resolve(ctx.cachedir, "server/frame.css.map"), "frame.css.map"))

	for (const url in routes) {
		if (url === "default") {
			continue
		}
		if (!url.startsWith("/")) {
			throw Error("Route definition that does not start with /")
		}

		// Get the component
		const Component = routes[url]
		const { props } = Component

		const assets = []
		global._frame_asset = function (asset : string) {
			assets.push(clean(ctx, asset))
		}

		// TODO: Is this _ctor thing a valid assumption?
		const component = (await Component.type._ctor()).default

		const [ entryid, propsfile ] = await Promise.all([
			entrypoint(ctx, url, assets[0]),
			ctx.write(`${url}/props.json`, JSON.stringify(compress(props)), true),
		])

		res.push({
			url,
			props,
			assets,
			component,
			entryid,
			propsfile,
		})
	}

	const shared : Shared = {
		css: await css,
		cssfile: await cssfile,
		systemfile: await sys,
	}

	const js = await client(ctx, res)

	for (const route of res) {
		route.jsfile = js.legacy.find(x => x.id === route.entryid)?.src
		route.mjsfile = js.modern.find(x => x.id === route.entryid)?.src

		const markup = html(ctx, route, shared)
		promises.push(ctx.write(`${route.url}/index.html`, markup))
	}

	await Promise.all(promises)
}

function clean (ctx : Compilation, asset : string) : string {
	const root = path.resolve(ctx.config.root)
	const relative = asset.replace(root, "")
	if (path.extname(relative) === "") {
		return `${relative}.js`
	}

	return relative
}
