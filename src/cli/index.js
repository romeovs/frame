#!/usr/bin/env node

import path from "path"

import yargs from "yargs"
import { install } from "source-map-support"
install()

import { clog, cerror, capture } from "../log/capture"
import { Compilation } from "../compilation"

async function main () {
	const args =
		yargs
			.command("build", "Build the website")
			.command("serve", "Serve website")
			.command("watch", "Watch and rebuild files")
			.option("root", {
				alias: "r",
				type: "string",
				required: true,
				description: "The path to the root content directory",
			})
			.option("output", {
				alias: "o",
				type: "string",
				description: "The path to the output directory",
			})
			.option("dev", {
				alias: "d",
				type: "boolean",
				description: "Run in dev mode (always on for watch)",
			})
			.option("verbosity", {
				alias: "v",
				choices: [
					"error",
					"warn",
					"info",
					"debug",
				],
				default: "info",
				description: "Log message verbosity level",
			})
			.option("colors", {
				type: "boolean",
				description: "Disable colors",
				default: true,
			})
			.option("port", {
				type: "integer",
				description: "The port to listen on in watch and serve mode",
			})
			.help()
			.argv

	capture()
	clog("")
	clog("  Welcome to 🖼  Frame!")
	clog("")

	const ctx = new Compilation({
		root: path.resolve(args.root),
		output: args.output || path.resolve(args.root, "dist"),
		dev: args.dev || args.watch,
		loglevel: args.verbosity,
		colors: args.colors,
	}, true)

	switch (args._[0]) {
	case "build":
		await ctx.build()
		return
	case "watch":
		await ctx.watch()
		return
	case "serve":
		await ctx.serve()
	}
}

main().catch(function (err : Error) {
	/* eslint-disable no-process-exit */
	cerror("error", err)
	process.exit(1)
})
