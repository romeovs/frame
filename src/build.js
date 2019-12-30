import { Timer } from "./timer"

import { manifest } from "./manifest"
import { client } from "./client"
import { server } from "./server"
import { entrypoints } from "./entrypoints"
import { render } from "./render"
import { system } from "./system"
import { robots, humans } from "./txt"
import { sitemap } from "./sitemap"
import { type Compilation } from "./compilation"

export async function build (ctx : Compilation) {
	const timer = new Timer()
	const sys = system(ctx)

	const m = await manifest(ctx)
	const e = await entrypoints(ctx, m)
	const map = await sitemap(ctx, m)

	const [ modern, legacy, srv ] = await Promise.all([
		client(ctx, m, e, true),
		ctx.config.dev ? [] : client(ctx, m, e, false),
		server(ctx, m, e),
		await robots(ctx, m, map),
		await humans(ctx),
	])

	await render(ctx, m, {
		modern,
		legacy,
		server: srv,
		system: await sys,
	})

	ctx.log("Done! (%s)", timer)
}
