import printf from "printf"
import { type Config } from "./config"
import { ColorfulLogger, LeveledLogger, NoopLogger, SimpleLogger } from "./log"

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
		this.fatal("NOT IMPLEMENTED")
	}
}
