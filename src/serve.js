import express, { type $Request, type $Response, type NextFunction } from "express"

import { Timer } from "./timer"
import { type Compilation } from "./compilation"
import { listen } from "./listen"

export function serve (ctx : Compilation) {
	const app = express()
	app.use(function (req : $Request, res : $Response, next : NextFunction) {
		/* eslint-disable callback-return */
		const timer = new Timer()
		next()
		ctx.log("  GET %s %s (%s)", res.statusCode, req.path, timer)
	})
	app.use(express.static(ctx.outputdir))

	listen(ctx, app)
}
