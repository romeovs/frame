import * as React from "react"
import DOM from "react-dom/server"
import path from "path"

import { HTML } from "./html"
import { purge } from "./purge-css"
import { minify } from "./min-html"
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
	await Promise.all(manifest.routes.map(route => one(ctx, manifest, assets, route)))
}

async function one<T> (ctx : Compilation, manifest : Manifest, assets : Assets, route : RouteDef<T>) {
	const server = assets.server.find(f => f.type === "js" && f.id === "spa")?.src
	const modern = assets.modern.find(f => f.type === "js" && f.id === "spa")?.src
	const legacy = assets.legacy.find(f => f.type === "js" && f.id === "spa")?.src
	const css = stylesheets(assets.modern || assets.legacy)

	const pth = path.resolve(ctx.config.root, route.import)
	const modulepreload = assets.modern.find(f => f.type === "js" && f.file && f.file.startsWith(pth))?.src

	global.IS_SERVER = true

	let body = ""
	let head = null
	if (server) {
		/* eslint-disable global-require, no-extra-parens */
		// $ExpectError: Flow cannot handle dynamic imports
		const [ Component, head_ ] = (await require(server)(route.url) : [ React.Component<T>, React.Node[] ])

		body = DOM.renderToString(<Component {...route.props} />)

		head = <RenderServer tags={head_} />
	}

	const pcss =
		ctx.config.dev
			? css.map(asset => asset.type === "css" ? asset.content : "").join(" ")
			: purge(ctx, body, css)

	const markup = DOM.renderToStaticMarkup(
		<HTML
			body={body}
			modern={modern}
			legacy={legacy}
			system={assets.system}
			css={pcss}
			cssfiles={css.map(asset => asset.src)}
			head={head}
			analytics={manifest.analytics}
			lang={manifest.lang}
			propsfile={route.propsfile}
			modulepreload={modulepreload}
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
