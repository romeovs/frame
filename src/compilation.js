import path from "path"

import printf from "printf"

import { type Config } from "./config"
import { ColorfulLogger, LeveledLogger, NoopLogger, SimpleLogger } from "./log"
import { build } from "./build"
import { hash } from "./hash"
import fs from "./fs"

export class Compilation {
	config : Config

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

	run () {
		return build(this)
	}

	get cachedir () : string {
		return path.resolve(this.config.root, ".frame_cache")
	}

	get outputdir () {
		return path.resolve(this.config.output)
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

	_resolveOutputFile (filename : string) : string {
		return path.resolve(this.config.output, filename.replace(/^\//, ""))
	}

	async copy (src : string, dst : string) : Promise<string> {
		const fname = this._resolveOutputFile(dst)
		const dir = path.dirname(fname)

		this.log("Writing %s", fname)

		await fs.mkdir(dir, { recursive: true })
		await fs.copyFile(src, fname)

		return fname
	}

	read (...segments : string[]) : Promise<string> {
		return fs.readFile(path.resolve(...segments), "utf-8")
	}

	async writeCache (filename : string, content : string | Buffer) : Promise<string> {
		const fname = path.resolve(this.cachedir, filename.replace(/^\//, ""))
		const dir = path.dirname(fname)

		this.debug("Writing cache %s", fname)

		await fs.mkdir(dir, { recursive: true })
		await fs.writeFile(fname, content)

		return fname
	}
}
