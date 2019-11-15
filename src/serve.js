import express from "express"

import Timer from "./timer"

export function serve (ctx : Compilation) {
	const port = ctx.config.port || 8080

	const app = express()
	app.use(function (req, res, next) {
		const timer = new Timer()
		next()
		ctx.log("  GET %s %s (%s)", res.statusCode, req.path, timer)
	})
	app.use(express.static(ctx.outputdir))

	app.listen(port)

	ctx.log("Listening on %s", `http://localhost:${port}`)
}
