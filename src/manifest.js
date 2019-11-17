import path from "path"
import glob from "glob"

import { type Compilation } from "./compilation"
import { load } from "./config"
import { hash } from "./hash"
import { asset } from "./assets"


type RouteDef = {
	url : string,
	component : string,
	props : {[string] : mixed },
}

type ImageFormat = "jpeg" | "webp" | "png" | "tiff" | "gif"

type ImageConfig = {
	gip : boolean,
	sizes : number[],
	formats : {
		[ImageFormat | "*"] : ImageFormat[],
	},
}

export type Manifest = {
	// The root frame file the manifest was built from
	root : string,

	// The image config, read from the asset file
	images : ImageConfig,

	// The routes of the site, with their respective props
	routes : {
		[string] : RouteDef,
	},

	// All assets that were loaded in the manifest file
	assets : string[],

	// All the globs that were used
	globs : string[],

	// Globals shared between js and css
	globals : {
		[string] : mixed,
	},

	globalsFile : string,
}

export async function manifest (ctx : Compilation) : Promise<Manifest> {
	ctx.log("Collecting assets and routes")
	const pth = path.resolve(ctx.config.root, "frame.js")
	const cfg = await load(ctx, pth)

	const assets = new Set()
	global._frame_asset = function (fname : string) {
		const filename = path.resolve(ctx.config.root, fname)
		assets.add(filename)
		return asset(ctx, cfg, filename)
	}

	const globs = new Set()
	global._frame_glob = function (...segments : string[]) : string[] {
		const pat = path.resolve(ctx.config.root, ...segments)
		globs.add(pat)
		return glob.sync(pat)
	}

	const [ defs, globals ] = await Promise.all([
		run(cfg.routes),
		run(cfg.globals),
	])

	const routes = {}
	for (const def of defs) {
		const { url, component, props } = def
		routes[url] = {
			id: hash(path.resolve(ctx.config.root, component)),
			url,
			component,
			props,
		}
	}

	const m : Manifest = {
		root: pth,
		...cfg,
		globals,
		routes,
		assets: Array.from(assets),
		globs: Array.from(globs),
	}

	m.globalsFile = await ctx.write("/g.json", JSON.stringify(m.globals || {}), true)
	await ctx.writeCache("manifest.json", JSON.stringify(m))
	return m
}

function run (fn) {
	if (typeof fn === "function") {
		return fn()
	}
	return fn
}
