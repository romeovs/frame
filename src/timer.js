export default class Timer {
	start : number

	constructor () {
		this.start = Date.now()
	}

	get elapsed () : number {
		return Date.now() - this.start
	}

	toString () : string {
		return format(this.elapsed)
	}
}

export function format (ms : number) : string {
	const sign = Math.sign(ms) < 0 ? "-" : ""
	const abs = Math.abs(ms)

	if (abs < 1000) {
		return `${sign}${abs}ms`
	}

	if (abs < 60000) {
		return `${sign}${abs / 1000}s`
	}

	const s = Math.round(abs / 1000)
	const re = s % 60
	const m = Math.floor((s - re) / 60)

	return `${sign}${m}m${re}s`
}
