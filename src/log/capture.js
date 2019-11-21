/* eslint-disable no-console */

import util from "util"

import { esc } from "./color"

// The color the captured logs will be printed in
const unkownColor = 56

// References to raw console logging messages
export const clog = console.log
export const cerror = console.error

// Capture all console.log messages and print them in a different color.
export function capture () {
	// $ExpectError: Flow thinks overwriting console.log is impossible
	console.log = function (...args : mixed[]) {
		clog(esc(unkownColor, util.format(...args)))
	}

	// $ExpectError: Flow thinks overwriting console.error is impossible
	console.error = function (...args : mixed[]) {
		cerror(esc(unkownColor, util.format(...args)))
	}
}

// Release the console logging capture and reinstall
// the default console methods.
export function release () {
	// $ExpectError: Flow thinks overwriting console.log is impossible
	console.log = clog

	// $ExpectError: Flow thinks overwriting console.error is impossible
	console.error = cerror
}
