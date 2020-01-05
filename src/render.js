import * as React from "react"
import DOM from "react-dom/server"

import { HTML } from "./html"
import { purge } from "./purge-css"
import { minify } from "./min-html"
import { props } from "./props"
import { RenderServer } from "./lib/head"

import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"
import { type BuildAssets, type Stylesheet, type Script } from "./client"
import { type RouteDef } from "./config"

type Assets = {
	modern : BuildAssets,
	legacy : BuildAssets,
	server : BuildAssets,
	system : Script[],
}

export async function render (ctx : Compilation, manifest : Manifest, assets : Assets) {
	const promises = manifest.routes.map(route => one(ctx, manifest, assets, route))
	await Promise.all(promises)
}

async function one<T> (ctx : Compilation, manifest : Manifest, assets : Assets, route : RouteDef<T>) {
	const server = assets.server.find(f => f.type === "js" && f.id === route.id)?.src
	const modern = assets.modern.find(f => f.type === "js" && f.id === route.id)?.src
	const legacy = assets.legacy.find(f => f.type === "js" && f.id === route.id)?.src
	const css = stylesheets(assets.modern || assets.legacy)

	global._frame_context = {
		globals: manifest.globals,
	}

	let body = ""
	let head = null
	if (server) {
		/* eslint-disable global-require, no-extra-parens */
		// $ExpectError: Flow cannot handle dynamic imports
		const [ Component, head_ ] = (require(server)() : [ React.Component<T>, React.Node[] ])

		body = DOM.renderToString(<Component {...route.props} />)

		head = <RenderServer tags={head_} />
	}

	const pcss =
		ctx.config.dev
			? css.map(asset => asset.type === "css" ? asset.content : "").join(" ")
			: purge(ctx, body, css)

	const propsfile = await props(ctx, manifest, route.props)

	const markup = DOM.renderToStaticMarkup(
		<HTML
			body={body}
			modern={modern}
			legacy={legacy}
			system={assets.system}
			css={pcss}
			cssfiles={css.map(asset => asset.src)}
			propsfile={propsfile}
			head={head}
			analytics={manifest.analytics}
		/>,
	)

	const html = `<!doctype html>${markup}`
	const min = ctx.config.dev ? html : minify(ctx, html)

	await ctx.write(`${route.url}/index.html`, min)
}

function stylesheets (assets : BuildAssets) : Stylesheet[] {
	const res : Stylesheet[] = []
	for (const asset of assets) {
		if (asset.type === "css") {
			res.push(asset)
		}
	}

	return res
}
