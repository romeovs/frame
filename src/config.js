import path from "path"

import * as React from "react"
import { rollup } from "rollup"

import { babel } from "./babel"
import { plugins } from "./shared"
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

type ESModule<T> = { default : T, ... }
type ESImport<T> = Promise<ESModule<T>>
export type Component<T> = ESImport<React.ComponentType<T>>

export type RouteDef<T> = {
	url : string,
	id : string,
	import : string,
	props : T,
}

export type Routes = RouteDef<*>[]

export type Globals = $ReadOnly<{
	[string] : mixed,
	...,
}>

export type FrameDefinition = {
	// The image config, read from the asset file
	images? : ImageConfig,

	// The routes of the site, with their respective props
	routes : () => Promise<(RouteDef<*> | null)[]>,

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
		plugins: [
			babel(ctx, true, false, [ plugin ]),
			...plugins(ctx),
		],
	})

	const output = await bundle.generate({
		exports: "named",
		format: "cjs",
		dir: "/tmp",
	})

	// temporarily overwrite require
	// $ExpectError: Flow does not know about require.extensions
	const jsloader = require.extensions[".js"]

	// $ExpectError: Flow does not know about require.extensions
	require.extensions[".css"] = function (module : Module, fname : string) {
		module._compile("{}")
	}

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

function plugin (Babel : mixed) : mixed {
	// $ExpectError: Flow does not know babel
	const t = Babel.types
	return {
		visitor: {
			CallExpression (pth : mixed, state : mixed) {
				// $ExpectError: Flow does not know babel
				const { callee, arguments: args } = pth.node
				if (callee.name !== "Route") {
					return
				}

				// $ExpectError: Flow does not know babel
				pth.replaceWith(t.objectExpression([
					t.objectProperty(t.stringLiteral("url"), args[0]),
					t.objectProperty(t.stringLiteral("import"), args[1].arguments[0]),
					t.objectProperty(t.stringLiteral("props"), args[2]),
				]))
			},
		},
	}
}
