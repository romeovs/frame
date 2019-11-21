import path from "path"

import { rollup } from "rollup"

import { babel } from "./babel"
import { type Compilation } from "./compilation"

export type ImageFormat = "jpeg" | "webp" | "png" | "tiff" | "gif"
export type ImageConfig = {
	gip : boolean,
	sizes : number[],
	formats : {
		[k : ImageFormat | "*"] : ImageFormat[],
		...,
	},
	quality? : number | {
		[k : ImageFormat | "*"] : number,
		...,
	},
}

export type RouteProps = {
	key? : string | number,
	...,
}

export type RouteDef = {
	url : string,
	component : string,
	props : RouteProps,
}

export type Globals = $ReadOnly<{
	[string] : mixed,
	...,
}>

export type FrameDefinition = {
	// The image config, read from the asset file
	images? : ImageConfig,

	// The routes of the site, with their respective props
	routes : () => Promise<RouteDef[]>,

	// Globals shared between js and css
	globals? : () => Promise<Globals>,

	// The dictionary used for compressing
	dictionary? : string[],

	// The browsers to build for
	browsers? : string[],
}

export async function load (ctx : Compilation, filename : string) : Promise<FrameDefinition> {
	const warnings = []
	const bundle = await rollup({
		input: filename,
		external (id : string) : boolean {
			return id[0] !== "." && !path.isAbsolute(id) || id.slice(-5, id.length) === ".json"
		},
		treeshake: false,
		onwarn: warnings.push,
		plugins: [ babel(ctx, true, false) ],
	})

	const output = await bundle.generate({
		exports: "named",
		format: "cjs",
	})

	// temporarily overwrite require
	// $ExpectError: Flow does not know about require.extensions
	const jsloader = require.extensions[".js"]

	// $ExpectError: Flow does not know about require.extensions
	require.extensions[".js"] = function (module : Module, fname : string) {
		if (filename === fname) {
			module._compile(output.output[0].code, fname)
		} else {
			jsloader(module, fname)
		}
	}

	delete require.cache[filename]
	/* eslint-disable global-require */
	const cfg = require(filename).default

	// $ExpectError: Flow does not know about require.extensions
	require.extensions[".js"] = jsloader

	return cfg
}
