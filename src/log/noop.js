import { Logger } from "./base"
import { type Level } from "./level"

export class NoopLogger extends Logger {
	_print (level : Level, msg : string, ...args : mixed[]) {
		// Does nothing
	}
}
