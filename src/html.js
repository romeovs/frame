import * as React from "react"

export function HTML (props : HTMLProps) : React.Node {
	/* elsint-disable react/forbid-dom-props */
	const { body, modern, legacy, system, propsfile, css, cssfiles, globalsfile, head } = props

	return (
		<html>
			<head>
				<meta charSet="utf-8" />
				{modern && <script defer type="module" src={modern} />}
				{legacy && system && <script defer noModule src={system} />}
				{head}
				{css && <style>{css}</style>}
				{propsfile && <link id="frameprops" href={propsfile} rel="prefetch" />}
				{globalsfile && <link id="frameglobals" href={globalsfile} rel="prefetch" />}
				<link rel="icon" href="data:," />
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

