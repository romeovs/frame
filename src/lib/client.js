import * as React from "react"
import DOM from "react-dom"
import { BrowserRouter } from "react-router-dom"

import { HeadProvider } from "__PACKAGE_NAME__/head"

export { useFrame } from "./use-frame"
export { default as Picture } from "./picture"
export { srcSet } from "./srcset"
export { Link, Meta, Style, Title } from "./head"
export { slug } from "./slug"

import { type Asset, type ImageAsset, type JSONAsset, type YAMLAsset, type MarkdownAsset } from "../assets"
import { type ImageFormat } from "../config"

export type {
	Asset,
	JSONAsset,
	YAMLAsset,
	ImageAsset,
	MarkdownAsset,
	ImageFormat,
}

export async function init (build : () => Promise<React.Node>) {
	const component = await build()

	const comp = (
		<BrowserRouter>
			<HeadProvider>
				<React.Suspense fallback={null}>
					{component}
				</React.Suspense>
			</HeadProvider>
		</BrowserRouter>
	)

	const app = document.getElementById("app")
	if (!app) {
		throw Error("<div id=\"app\"> is missing")
	}

	if (global.DEV === "development") {
		/* eslint-disable no-console */
		console.log("This page is rendered with Frame.js")
		DOM.render(comp, app)
	} else {
		DOM.hydrate(comp, app)
	}
}
