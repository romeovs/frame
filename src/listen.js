import { type Compilation } from "./compilation"

export function listen (ctx : Compilation, app : mixed) {
	_listen(ctx, app, 0)
}

function _listen (ctx : Compilation, app : mixed, i : number) {
	const port = ctx.config.port || 8080

	ctx.debug("Trying port %s", port + i)

	app
		.listen(port + i, () => ctx.log("Listening on %s", `http://localhost:${port + i}`))
		.on("error", function (err) {
			if (err.errno !== "EADDRINUSE") {
				throw err
			}

			if (i > 100) {
				throw Error(`Ports ${port} - ${port + 100} are all busy`)
			}

			_listen(ctx, app, i + 1)
		})
}
