import path from "path"
import EventEmitter from "events"

import { type Compilation } from "./compilation"
import { watch as watchServer } from "./server"
import { watch as watchClient } from "./client"
import { entrypoint } from "./entrypoint"
import { compress } from "./compress"
import { html } from "./html"
import { system } from "./system"

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

export async function watch (ctx : Compilation) {
	const evts = new EventEmitter()

	let routes = []

	let client = null
	const server = watchServer(ctx)

	let css
	let cssfile
	const sys = system(ctx)

	server.on("event", async function (evt) {
		if (evt.code !== "END") {
			return
		}

		const f = path.resolve(ctx.cachedir, "server/frame.js")
		const rts = await import(f)
		const res = []
		for (const url in rts) {
			if (url === "default") {
				continue
			}
			if (!url.startsWith("/")) {
				throw Error("Route definition that does not start with /")
			}

			// Get the component
			const Component = rts[url]
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


		css = await ctx.read(ctx.cachedir, "server/frame.css")
		cssfile = await ctx.write("/main.css", css, true)

		if (routes.length !== res.length) {
			routes = res
			// TODO: check if routes actually changed.
			evts.emit("routes_changed", routes)
		}
	})

	evts.on("routes_changed", function () {
		if (client) {
			client.close()
		}
		client = watchClient(ctx, routes)

		client.on("entrypoints", async function (entrypoints) {
			const promises = []
			for (const route of routes) {
				route.mjsfile = entrypoints.find(x => x.id === route.entryid)?.src

				const markup = html(ctx, route, {
					css,
					cssfile,
					systemfile: sys,
				})

				promises.push(ctx.write(`${route.url}/index.html`, markup))
			}

			await Promise.all(promises)
			console.log("DONE")
		})
	})
}

function clean (ctx : Compilation, asset : string) : string {
	const root = path.resolve(ctx.config.root)
	const relative = asset.replace(root, "")
	if (path.extname(relative) === "") {
		return `${relative}.js`
	}

	return relative
}
