import process from "process"
import printf from "printf"
import { type Writable } from "stream"

import Timer from "../timer"

import { type Level } from "./level"
import { Logger } from "./base"

export class SimpleLogger extends Logger {
	constructor (out : Writable = process.stdout) {
		super()
		this._timer = new Timer()
		this._out = out
	}

	_print (level : Level, msg : string, ...args : mixed[]) {
		printf(this._out, `%-5s % 6.0f ${msg}\n`, level.toUpperCase(), this._timer.elapsed, ...args)
	}
}
