#!/usr/bin/env node

import { clog, cerror, capture } from "../log/capture"
import { Compilation } from "../compilation"

async function main () {
	capture()

	const ctx = new Compilation({
		root: "./example",
	}, true)

	clog("")
	clog("  Welcome to 🖼  Frame!")
	clog("")

	await ctx.run()
}

main().catch(function (err : Error) {
	/* eslint-disable no-process-exit */
	cerror("error", err)
	process.exit(1)
})
