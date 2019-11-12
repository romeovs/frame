import * as React from "react"
import DOM from "react-dom/server"

import { minify } from "./min-html"
import { purge } from "./purge-css"
import { render } from "./render"

export function html (ctx : Compilation, route : Route, shared : Shared) {
	const body = render(ctx, <route.component {...route.props} />)
	const pcss =
		ctx.config.dev
			? shared.css
			: purge(ctx, body, shared.css.replace(/\/\*#.*$/, ""))

	const markup = DOM.renderToStaticMarkup(
		<HTML
			body={body}
			css={pcss}
			cssfile={shared.cssfile}
			system={shared.systemfile}
			propsfile={route.propsfile}
			jsfile={route.jsfile}
			mjsfile={route.mjsfile}
		/>,
	)

	const html = `<!doctype html>${markup}`

	if (ctx.config.dev) {
		return html
	}

	return minify(ctx, html)
		.replace(/<style><\/style>/g, "")
		.replace(/<\/style><style>/g, "")
		.replace(/defer=""/, "defer")
		.replace(/nomodule=""/, "nomodule")
}

export type HTMLProps = {
	body : string,
	css : string,
	cssfile : string,
	jsfile : string,
	mjsfile : string,
	propsfile : mixed,
}

function HTML (props : HTMLProps) : React.Node {
	/* elsint-disable react/forbid-dom-props */
	const { body, css, cssfile, mjsfile, jsfile, propsfile, system } = props


	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				<link rel="icon" href="data:," />
				<style>{css}</style>
				<link rel="propsfile" id="frameprops" href={propsfile} />
				{mjsfile && <script defer type="module" src={mjsfile} />}
				{jsfile && <script defer noModule src={system} />}
			</head>
			<body>
				<div id="app" dangerouslySetInnerHTML={{ __html: body }} />
				<link rel="stylesheet" href={cssfile} />
				{jsfile && <SystemJS href={jsfile} />}
			</body>
		</html>
	)
}

type SystemProps = {
	href : string,
}

function SystemJS (props : SystemProps) : React.Node {
	const { href } = props
	const __html = `
		document.addEventListener("DOMContentLoaded", function () {
			System.import("${href}")
		})
	`

	return (
		<script
			noModule
			dangerouslySetInnerHTML={{ __html }}
		/>
	)
}
