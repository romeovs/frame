import path from "path"

import { type Compilation } from "./compilation"
import fs from "./fs"
import { hash } from "./hash"

function file (ctx : Compilation, key : string) : string {
	return path.resolve(ctx.cachedir, "_", `${key}.json`)
}

async function read (ctx : Compilation, key : string) : Promise<mixed> {
	try {
		const f = file(ctx, key)
		const json = await fs.readFile(f, "utf-8")
		return JSON.parse(json)
	} catch (err) {
		return null
	}
}

async function write (ctx : Compilation, key : string, data : mixed) {
	const json = JSON.stringify(data)
	if (!json) {
		return
	}

	const f = file(ctx, key)

	// $ExpectError: Flow does not know about recursive
	await fs.mkdir(path.dirname(f), { recursive: true })
	await fs.writeFile(f, json)
}

function tokey (ctx : Compilation, key : string | string[]) : string {
	const k = Array.isArray(key) ? key.join(".") : key
	return hash(k.replace(ctx.config.root, ""))
}

export async function cache (ctx : Compilation, key : string | string[], fn : () => mixed) : Promise<mixed> {
	if (ctx.config.force) {
		ctx.debug("Not checking cache for key %s because force is %s", key, ctx.config.force)
		return fn()
	}

	const k = tokey(ctx, key)
	const data = await read(ctx, k)
	if (data) {
		return data
	}

	const d = await fn()
	await write(ctx, k, d)
	return d
}
