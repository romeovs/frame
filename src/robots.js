import path from "path"

import fs from "./fs"
import { type Compilation } from "./compilation"

export async function robots (ctx : Compilation, sitemap : string) {
	try {
		const txt = path.resolve(ctx.config.root, "robots.txt")
		const template = await fs.readFile(txt, "utf-8")
		const content = template.replace(/\/?{sitemap}/, sitemap)
		await ctx.write("robots.txt", content)
	} catch {
		// noop
	}
}
