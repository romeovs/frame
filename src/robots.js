import path from "path"

import fs from "./fs"
import { type Compilation } from "./compilation"

export async function robots (ctx : Compilation) {
	try {
		const txt = path.resolve(ctx.config.root, "robots.txt")
		const content = await fs.readFile(txt, "utf-8")
		await ctx.write("robots.txt", content)
	} catch {
		// noop
	}
}
