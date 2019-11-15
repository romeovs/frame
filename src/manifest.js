import path from "path"
import { type Compilation } from "./compilation"
import { load } from "./config"
import { hash } from "./hash"
import { asset } from "./assets"


type RouteDef = {
	component : string,
	props : {[string] : mixed },
}

type ImageFormat = "jpeg" | "webp" | "png" | "tiff" | "gif"

type ImageConfig = {
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
}

export async function manifest (ctx : Compilation) : Promise<Manifest> {
	const pth = path.resolve(ctx.config.root, "frame.js")
	const cfg = await load(pth)

	const assets = new Set()
	global._frame_asset = function (fname : string) {
		const filename = path.resolve(ctx.config.root, fname)
		assets.add(filename)
		return asset(ctx, cfg, filename)
	}

	const globs = new Set()
	global._frame_glob = globs.add.bind(globs)


	const routes = await cfg.routes()
	for (const url in routes) {
		const route = routes[url]
		route.id = hash(path.resolve(ctx.config.root, route.component))
		route.url = url
	}

	const m : Manifest = {
		root: pth,
		...cfg,
		routes,
		assets: Array.from(assets),
		globs: Array.from(globs),
	}

	await ctx.writeCache("manifest.json", JSON.stringify(m))
	return m
}