import path from "path"
import printf from "printf"
import chokidar from "chokidar"

import fs from "./fs"
import { ColorfulLogger, LeveledLogger, NoopLogger, SimpleLogger, type LogLevel, type Logger } from "./log"
import { hash } from "./hash"
import { cache } from "./cache"

import { manifest } from "./manifest"
import { watch as watchClient } from "./watch"
import { entrypoints } from "./entrypoints"
import { render } from "./render"
import { serve } from "./serve"
import { gzip } from "./gzip"
import { brotli } from "./brotli"
import { type BuildAssets } from "./client"
import { spa } from "./spa"

import { build } from "./build"

export type InputConfig = {
	root : string,
	output? : string,
	cache? : string,
	dev? : boolean,
	loglevel? : LogLevel,
	colors? : boolean,
	force? : boolean,
	onWarning? : string => void,
	port? : number,
}

export type Config = {
	root : string,
	output : string,
	cache : string,
	dev : boolean,
	loglevel : LogLevel,
	colors : boolean,
	force : boolean,
	onWarning : string => void,
	port : number,
}

function normalize (cfg : InputConfig) : Config {
	const noop = () => undefined

	return {
		root: cfg.root,
		output: cfg.output || path.resolve(cfg.root, "dist"),
		cache: cfg.cache || path.resolve(cfg.root, ".frame_cache"),
		dev: Boolean(cfg.dev),
		loglevel: cfg.loglevel || "info",
		colors: cfg.colors !== false,
		onWarning: cfg.onWarning || noop,
		force: Boolean(cfg.force),
		port: cfg.port || 8080,
	}
}

export class Compilation {
	config : Config
	cli : boolean
	logger : Logger

	constructor (config : InputConfig, cli : boolean = false) {
		this.config = normalize(config)
		this.cli = cli

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
		if (this.cli) {
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
		if (this.config.cache) {
			return path.resolve(this.config.cache)
		}
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

		const [ fn ] = await Promise.all([
			this._writeFile(fname, content),
			gzip(this, fname, content),
			brotli(this, fname, content),
		])

		return fn
	}

	// Write a file to the output folder
	async _writeFile (filename : string, content : string | Buffer) : Promise<string> {
		const base = filename.replace(/\/\//g, "/").replace(/^\//, "")
		const fn = path.resolve(this.outputdir, base)
		const dir = path.dirname(fn)

		this.log("Writing %s", `/${base}`)

		// $ExpectError: Flow does not know about recursive
		await fs.mkdir(dir, { recursive: true })
		await fs.writeFile(fn, content)

		return `/${base}`
	}

	async writeCache (filename : string, content : string | Buffer) : Promise<string> {
		const fname = path.resolve(this.cachedir, filename.replace(/\/\//g, "/").replace(/^\//, ""))
		const dir = path.dirname(fname)

		this.debug("Writing cache %s", fname)

		// $ExpectError: Flow does not know about recursive
		await fs.mkdir(dir, { recursive: true })
		await fs.writeFile(fname, content)

		return fname
	}

	// Cache a function call.
	cache (key : string | string[], fn : () => mixed) : Promise<mixed> {
		return cache(this, key, fn)
	}

	async build () {
		await build(this)
	}

	async watch () {
		/* eslint-disable consistent-this */
		const ctx = this

		let m = null
		let e = null

		async function rebuild () {
			m = await manifest(ctx)

			// Changing the entrypoints will trigger a client build
			// e = await entrypoints(ctx, m)
			e = await spa(ctx, m)

			// Add new files to be watched
			assets.add([
				...m.globs,
				...m.assets,
			])
		}

		// TODO: find a way to refresh when props change

		const assets = chokidar.watch([
			ctx.framefile,
			...m?.globs || [],
			...m?.assets || [],
		], {
			ignoreInitial: true,
		})
		assets.on("change", rebuild)
		assets.on("add", rebuild)
		assets.on("unlink", rebuild)

		await rebuild()

		let modern : ?BuildAssets = null

		if (!m || !e) {
			throw Error("Could not start watching")
		}

		const c = watchClient(ctx, m, e)
		/* eslint-disable flowtype/require-return-type */
		c.on("build", async function (a : BuildAssets) : Promise<void> {
			modern = a
			if (modern && m) {
				ctx.log("Rendering routes")
				await render(ctx, m, {
					modern,
					server: [],
					legacy: [],
					system: [],
				})
				ctx.log("Done!")
			}
		})
	}

	serve () {
		serve(this)
	}
}
