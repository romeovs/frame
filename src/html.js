import * as React from "react"

export function HTML (props : HTMLProps) : React.Node {
	/* elsint-disable react/forbid-dom-props */
	const { body, modern, legacy, system, propsfile, css, cssfiles } = props

	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				<link rel="icon" href="data:," />
				{css && <style>{css}</style>}
				{propsfile && <link rel="propsfile" id="frameprops" href={propsfile} rel="prefetch" />}
				{modern && <script defer type="module" src={modern} />}
				{legacy && system && <script defer noModule src={system} />}
			</head>
			<body>
				<div id="app" dangerouslySetInnerHTML={{ __html: body }} />
				{cssfiles && cssfiles.map(href => <link key={href} rel="stylesheet" href={href} />)}
				{legacy && system && <SystemJS href={legacy} />}
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

