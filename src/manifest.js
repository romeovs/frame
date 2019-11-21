import path from "path"
import glob from "glob"

import { type Compilation } from "./compilation"
import { load, type RouteDef, type ImageConfig } from "./config"
import { hash } from "./hash"
import { asset } from "./assets"
import * as defaults from "./defaults"

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

	// The dictionary used for compressing
	dictionary : string[],
}

export async function manifest (ctx : Compilation) : Promise<Manifest> {
	ctx.log("Collecting assets and routes")
	const pth = path.resolve(ctx.config.root, "frame.js")
	const cfg = await load(ctx, pth)

	const assets = new Set()
	global._frame_asset = function (fname : string) : Asset {
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
		dictionary: cfg.dictionary || defaults.dictionary,
		globals,
		routes,
		assets: Array.from(assets),
		globs: Array.from(globs),
	}

	await ctx.writeCache("manifest.json", JSON.stringify(m))
	return m
}

function run<T> (fn : () => T) : T {
	if (typeof fn === "function") {
		return fn()
	}
	return fn
}
