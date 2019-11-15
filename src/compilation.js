import path from "path"
import printf from "printf"
import chokidar from "chokidar"

import fs from "./fs"
import { type Config } from "./config"
import { ColorfulLogger, LeveledLogger, NoopLogger, SimpleLogger } from "./log"
import { hash } from "./hash"
import { cache } from "./cache"
import Timer from "./timer"

import { manifest } from "./manifest"
// import { client, watch as watchClient } from "./client"
import { client } from "./client"
import { watch as watchClient } from "./watch"
import { server } from "./server"
import { entrypoints } from "./entrypoints"
import { render } from "./render"
import { system } from "./system"

export class Compilation {
	constructor (config : Config, cli : boolean = false) {
		this.config = config

		const logger = this.config.colors ? new ColorfulLogger() : new SimpleLogger()
		this.logger =
			cli
				? new LeveledLogger(logger, this.config.loglevel)
				: new NoopLogger()
	}

	// Log a debug message, formatting args using printf.
	debug (msg : string, ...args : mixed[]) {
		this.logger.debug(msg, ...args)
	}

	// Log a message, formatting args using printf.
	log (msg : string, ...args : mixed[]) {
		this.logger.log(msg, ...args)
	}

	// Log a warning message, formatting args using printf.
	warn (msg : string, ...args : mixed[]) {
		this.logger.warn(msg, ...args)
		this.config.onWarning(printf(msg, ...args))
	}

	// Log an error message, formatting args using printf.
	error (msg : string, ...args : mixed[]) {
		this.logger.error(msg, ...args)
	}

	// Log a fatal error message and stop building.
	fatal (msg : string, ...args : mixed[]) {
		if (this.config.cli) {
			/* eslint-disable no-process-exit */
			this.error(msg, ...args)
			process.exit(1)
		} else {
			throw new Error(printf(msg, ...args))
		}
	}

	get framefile () : string {
		return path.resolve(this.config.root, "frame.js")
	}

	get cachedir () : string {
		return path.resolve(this.config.root, ".frame_cache")
	}

	get outputdir () : string {
		return path.resolve(this.config.output || `${this.config.root}/dist`)
	}

	// Write the contents of the file to the output folder, performing
	// some other transformations that might need to be done (like gzipping).
	async write (filename : string, content : string | Buffer, addHash : boolean = false) : Promise<string> {
		let fname = filename
		if (addHash) {
			const ext = path.extname(filename)
			const base = filename.replace(new RegExp(`${ext}$`), "")
			fname = `${base}.${await hash(content)}${ext}`
		}

		this.log("Writing %s", fname)

		await Promise.all([
			this._writeFile(fname, content),
			// gzip(this, fname, content),
			// brotli(this, fname, content),
		])

		return fname
	}

	// Write a file to the output folder
	async _writeFile (filename : string, content : string | Buffer) {
		const fn = path.resolve(this.outputdir, filename.replace(/^\//, ""))
		const dir = path.dirname(fn)

		await fs.mkdir(dir, { recursive: true })
		await fs.writeFile(fn, content)
	}

	async writeCache (filename : string, content : string | Buffer) : Promise<string> {
		const fname = path.resolve(this.cachedir, filename.replace(/^\//, ""))
		const dir = path.dirname(fname)

		this.debug("Writing cache %s", fname)

		await fs.mkdir(dir, { recursive: true })
		await fs.writeFile(fname, content)

		return fname
	}

	// Cache a function call.
	cache (key : string | string[], fn : () => mixed) : Promise<mixed> {
		return cache(this, key, fn)
	}

	async build () {
		const ctx = this
		const timer = new Timer()
		const sys = system(ctx)

		const m = await manifest(ctx)
		const e = await entrypoints(ctx, m)

		const [ modern, legacy, srv ] = await Promise.all([
			client(ctx, m, e, true),
			ctx.config.dev ? [] : client(ctx, m, e, false),
			server(ctx, m, e),
		])

		await render(ctx, m, {
			modern,
			legacy,
			server: srv,
			system: await sys,
		})

		ctx.log("Done! (%s)", timer)
	}

	async watch () {
		const ctx = this

		let m
		let e

		async function rebuild () {
			m = await manifest(ctx)

			// Changing the entrypoints will trigger a client build
			e = await entrypoints(ctx, m)
		}

		await rebuild()

		// TODO: find a way to refresh when props change

		const assets = chokidar.watch([
			ctx.framefile,
			...m.globs,
			...m.assets,
		])
		assets.on("change", rebuild)
		assets.on("add", rebuild)
		assets.on("unlink", rebuild)

		const x = {
			modern: null,
			server: [],
			legacy: [],
		}

		const c = watchClient(ctx, m, e, true)
		c.on("build", async function (modern) {
			x.modern = modern
			if (x.modern && x.server) {
				ctx.log("Rendering routes")
				await render(ctx, m, x)
				ctx.log("Done!")
			}
		})
	}
}
