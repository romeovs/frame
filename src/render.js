import * as React from "react"
import DOM from "react-dom/server"

import { HTML } from "./html"
import { purge } from "./purge-css"
import { minify } from "./min-html"
import { context } from "./lib/shared"
import { compress } from "./compress"
import { mapv } from "./map"

type JS = {
	modern : JSMap,
	legacy : JSMap,
	server : JSMap,
	system : string,
}


export async function render (ctx : Compilation, manifest : Manifest, js : JS) {
	const promises = []
	for (const url in manifest.routes) {
		const route = manifest.routes[url]
		promises.push(one(ctx, manifest, js, route))
	}

	await Promise.all(promises)
}

async function one (ctx : Compilation, manifest : Manifest, js : JS, route : RouteDef) {
	const server = js.server.find(f => f.id === route.id)?.src
	const modern = js.modern.find(f => f.id === route.id)?.src
	const legacy = js.legacy.find(f => f.id === route.id)?.src
	const css = (js.modern || js.legacy).filter(f => f.type === "css")

	global._frame_context = {
		globals: manifest.globals,
	}

	let body = ""
	let head = []
	if (server) {
		const [ Component, head_ ] = require(server)
		body = DOM.renderToString(<Component {...route.props} />)
		head = head_.map((tag, i) => (
			<React.Fragment key={i}>
				{tag}
			</React.Fragment>
		))
	}

	const pcss =
		ctx.config.dev
			? css.map(asset => asset.content).join(" ")
			: purge(ctx, body, css)

	const propsfile = await ctx.write(`${route.url}/p.json`, JSON.stringify(mapv(route.props, v => compress(v))), true)

	const markup = DOM.renderToStaticMarkup(
		<HTML
			body={body}
			modern={modern}
			legacy={legacy}
			system={js.system}
			css={pcss}
			cssfiles={css.map(asset => asset.src)}
			propsfile={propsfile}
			globalsfile={manifest.globalsFile}
			head={head}
		/>,
	)

	const html = `<!doctype html>${markup}`
	const min = ctx.config.dev ? html : minify(ctx, html)

	await ctx.write(`${route.url}/index.html`, min)
}
