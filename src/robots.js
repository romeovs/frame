import path from "path"

import fs from "./fs"
import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"

export async function robots (ctx : Compilation, manifest : Manifest, sitemap : string) {
	try {
		const txt = path.resolve(ctx.config.root, "robots.txt")
		const template = await fs.readFile(txt, "utf-8")
		const content = template.replace(/{sitemap}/, manifest.hostname + sitemap)
		await ctx.write("robots.txt", content)
	} catch {
		// noop
	}
}
