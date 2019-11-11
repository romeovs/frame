#!/usr/bin/env node

import { clog, cerror, capture } from "../log/capture"

async function main () {
	capture()

	const cfg = {
		root: "./example",
	}

	clog("")
	clog("  Welcome to 🖼  Frame!")
	clog("")

	cerror("  NOT IMPLEMENTED")
	await 0
}

main().catch(function (err : Error) {
	/* eslint-disable no-process-exit */
	cerror("error", err)
	process.exit(1)
})
