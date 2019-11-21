import { Logger } from "./base"
import { is, type Level } from "./level"

export class LeveledLogger extends Logger {
	_level : Level
	_logger : Logger

	constructor (logger : Logger, level : Level) {
		super()
		this._level = level
		this._logger = logger
	}

	_canlog (level : Level) : boolean {
		return is(level, this._level)
	}

	_print (level : Level, msg : string, ...args : mixed[]) {
		if (this._canlog(level)) {
			this._logger._print(level, msg, ...args)
		}
	}
}
