import * as React from "react"
import { type Script } from "./client"


type HTMLProps = {
	modern? : string,
	legacy? : string,
	system? : Script[],
	css : string,
	cssfiles : string[],
	head : React.Node,
	body : string,
	propsfile : string,
}

export function HTML (props : HTMLProps) : React.Node {
	/* eslint-disable react/forbid-dom-props */
	const { body, modern, legacy, system, propsfile, css, cssfiles, head } = props

	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				{modern && <script defer type="module" src={modern} />}
				{legacy && system && system.map(asset => <script defer noModule src={asset.src} key={asset.id} />)}
				{css && <style>{css}</style>}
				{propsfile && <link id="frameprops" href={propsfile} rel="prefetch" />}
				{head}
			</head>
			<body>
				<div id="app" dangerouslySetInnerHTML={{ __html: body }} />
				{cssfiles && cssfiles.map(href => <link key={href} rel="stylesheet" href={href} />)}
				{legacy && system && <SystemJS href={legacy} />}
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

