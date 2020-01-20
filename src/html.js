import * as React from "react"
import { type Script } from "./client"
import { analytics } from "./analytics"


type HTMLProps = {
	modern? : string,
	legacy? : string,
	system? : Script[],
	lang : string,
	css : string,
	cssfiles : string[],
	head : React.Node,
	body : string,
	propsfile : string,
	modulepreload? : string,
	analytics? : {
		fathom? : FathomConfig,
	},
}

export function HTML (props : HTMLProps) : React.Node {
	/* eslint-disable react/forbid-dom-props */
	const { body, modern, legacy, system, propsfile, css, cssfiles, head, analytics: _analytics, lang, modulepreload } = props

	return (
		<html lang={lang}>
			<head>
				<meta charSet="utf-8" />
				{propsfile && <link href={propsfile} rel="prefetch" />}
				{modulepreload && <link href={modulepreload} rel="modulepreload" />}
				{modern && <script defer type="module" src={modern} />}
				{legacy && system && system.map(asset => <script defer noModule src={asset.src} key={asset.id} />)}
				{css && <style>{css}</style>}
				{head}
			</head>
			<body>
				<div id="app" dangerouslySetInnerHTML={{ __html: body }} />
				{cssfiles && cssfiles.map(href => <link key={href} rel="stylesheet" href={href} />)}
				{legacy && system && <SystemJS href={legacy} />}
				{analytics(_analytics)}
			</body>
		</html>
	)
}

HTML.defaultProps = {
	legacy: undefined,
	modern: undefined,
	system: [],
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

