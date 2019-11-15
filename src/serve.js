import express from "express"

export function serve (ctx : Compilation) {
	// Set up express server
	const app = express()
	app.use(express.static(ctx.outputdir))
	app.listen(ctx.config.port || 8080)
}
