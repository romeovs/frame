import * as React from "react"
import DOM from "react-dom/server"

import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"

export async function sitemap (ctx : Compilation, manifest : Manifest) : Promise<string> {
	const now = new Date().toISOString()

	const urls = manifest.routes.map(route => (
		<url key={route.id}>
			<loc>{manifest.hostname}{route.url}</loc>
			<lastmod>{now}</lastmod>
		</url>
	))

	const component = (
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
			{urls}
		</urlset>
	)

	const content = DOM.renderToStaticMarkup(component)
	const xml = `<?xml version="1.0" encoding="UTF-8"?>${content}`

	return ctx.write("/_/sitemap.xml", xml, true)
}
