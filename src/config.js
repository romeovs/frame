import path from "path"

import { rollup } from "rollup"

import { babel } from "./babel"

export async function load (filename : string) {
	const warnings = []
	const bundle = await rollup({
		input: filename,
		external (id : string) : boolean {
			return id[0] !== "." && !path.isAbsolute(id) || id.slice(-5, id.length) === ".json"
		},
		treeshake: false,
		onwarn: warnings.push,
		plugins: [ babel({}, true, false) ],
	})

	const output = await bundle.generate({
		exports: "named",
		format: "cjs",
	})

	// temporarily overwrite require
	const jsloader = require.extensions[".js"]
	require.extensions[".js"] = function (module : Module, fname : string) {
		if (filename === fname) {
			module._compile(output.output[0].code, fname)
		} else {
			jsloader(module, fname)
		}
	}

	delete require.cache[filename]
	const cfg = require(filename).default
	require.extensions[".js"] = jsloader

	return cfg
}
