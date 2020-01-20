import path from "path"
import glob from "glob"

import { type Compilation } from "./compilation"
import { type AnalyticsConfig } from "./analytics"
import { load, type ImageConfig, type RouteDef, type FrameDefinition, type Globals } from "./config"
import { hash } from "./hash"
import { asset, type Asset } from "./assets"
import { type Security } from "./txt"
import { props } from "./props"
import * as defaults from "./defaults"

export type Manifest = {
	// The root frame file the manifest was built from
	root : string,

	// The image config, read from the asset file
	images : ImageConfig,

	// The routes of the site, with their respective props
	routes : RouteDef<*>[],

	// All assets that were loaded in the manifest file
	assets : string[],

	// All the globs that were used
	globs : string[],

	// Globals shared between js and css
	globals : Globals,

	// The dictionary used for compressing
	dictionary : string[],

	// The browsers to build for
	browsers : string[],

	// Hostname is the hostname (and protocol)
	hostname : string,

	// Security definition for security.txt
	security? : Security,

	// Analytics config
	analytics : AnalyticsConfig,

	// HTML lang
	lang : string,

	// The timeout in ms before the load component is shown
	loadTimeout : number,
}

export async function manifest (ctx : Compilation) : Promise<Manifest> {
	ctx.log("Collecting assets and routes")
	const pth = path.resolve(ctx.config.root, "frame.js")
	const cfg : FrameDefinition = await load(ctx, pth)

	const assets = new Set()
	global._frame_asset = function (fname : string) : Promise<?Asset> {
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

	const [ routes, globals ] = await Promise.all([
		run(cfg.routes),
		run(cfg.globals || Promise.resolve({})),
	])

	const m : Manifest = {
		...cfg,
		images: {
			gip: cfg.images && "gip" in cfg.images ? cfg.images.gip : true,
			sizes: cfg.images?.sizes || [ Infinity ],
			formats: cfg.images?.formats || {
				jpeg: [ "jpeg" ],
				webp: [ "webp" ],
				png: [ "png" ],
			},
			quality: cfg.images?.quality || 90,
		},
		root: pth,
		dictionary: cfg.dictionary || defaults.dictionary,
		globals,
		routes:
			await Promise.all(
				routes
					.filter(route => Boolean(route))
					.map(async route => ({
						...route,
						id: hash(path.resolve(ctx.config.root, route.import)),
						propsfile: await props(ctx, route.props),
					})),
			),
		assets: Array.from(assets),
		globs: Array.from(globs),
		browsers: cfg.browsers || [ "> 2%" ],
		analytics: cfg.analytics || {
			fathom: undefined,
		},
		lang: cfg.lang || "en",
		loadTimeout: cfg.loadTimeout || 400,
	}

	await ctx.writeCache("manifest.json", JSON.stringify(m))
	return m
}

function run<T> (fn : Promise<T> | () => Promise<T>) : Promise<T> {
	if (typeof fn === "function") {
		return fn()
	}
	return fn
}
