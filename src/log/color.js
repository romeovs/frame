type Color = number

// A range of orange colors
const colors : Color = [
	29,
	30,
	31,
	32,
	33,
	32,
	31,
	30,
]


// The current index in colors
let n = -1

// Return the next color in the row
export function color () : number {
	n = (n + 1) % colors.length
	return colors[n]
}

// Colorize the string with the specified color
export function esc (c : number, str : string) : string {
	return `\u001B[38;5;${c}m${str}\u001B[0m`
}
