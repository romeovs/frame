// The base class for loggers
export class Logger {
	// Implement this method in all Loggers.
	_print (level : Level, msg : string, ...args : mixed[]) {
		throw new Error("print: Not implemented")
	}

	// Log a debug message, formatting args using printf.
	debug (msg : string, ...args : mixed[]) {
		this._print("debug", msg, ...args)
	}

	// Log an info message
	info (msg : string, ...args : mixed[]) {
		this._print("info", msg, ...args)
	}

	// Alias for info()
	log (msg : string, ...args : mixed[]) {
		this.info(msg, ...args)
	}

	// Log a warning message
	warn (msg : string, ...args : mixed[]) {
		this._print("warn", msg, ...args)
	}

	// Log an error message, formatting args using printf.
	error (msg : string, ...args : mixed[]) {
		this._print("error", msg, ...args)
	}
}
