import process from "process"
import printf from "printf"

import Timer from "../timer"

import { esc, color } from "./color"
import { Logger } from "./base"

const name = "frame"

const interpolateColor = 136
const debugColor = 58

export class ColorfulLogger extends Logger {
	constructor (out : Writable = process.stdout) {
		super()
		this._timer = new Timer()
		this._out = out
	}

	_print (level : Level, msg : string, ...args : mixed[]) {
		const clr = level === "debug" ? debugColor : color()
		const highlighted = msg.replace(/% ?[0-9A-Za-z.]+/g, function (str : string) : string {
			return esc(interpolateColor, str)
		})

		printf(this._out, `${esc(clr, name)} ${highlighted} ${esc(clr, "%s")}\n`, ...args, `+${this._timer.elapsed}ms`)
	}
}
