export type Level = "debug" | "info" | "warn" | "error"

export const levels : Level[] = [
	"error",
	"warn",
	"info",
	"debug",
]

// Return wether or not str is greater than or equal level.
export function is (level : Level, str : Level) : boolean {
	return levels.indexOf(level) <= levels.indexOf(str)
}
