#!/usr/bin/env node

import { install } from "source-map-support"
install()

import { clog, cerror, capture } from "../log/capture"
import { Compilation } from "../compilation"

async function main () {
	capture()

	const ctx = new Compilation({
		root: "./example",
		output: "./example/dist",
		// dev: true,
		loglevel: "debug",
		colors: true,
	}, true)

	clog("")
	clog("  Welcome to 🖼  Frame!")
	clog("")

	await ctx.build()
	// await ctx.watch()
	// await ctx.run()
}

main().catch(function (err : Error) {
	/* eslint-disable no-process-exit */
	cerror("error", err)
	process.exit(1)
})
