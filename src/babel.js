import path from "path"
import babelPlugin from "rollup-plugin-babel"

import { type Compilation } from "./compilation"
import { name } from "./pkg"

const extensions = [ ".js" ]

export function babel (ctx : Compilation, server : boolean, modern : boolean, plugins : mixed[] = []) : babelPlugin {
	return babelPlugin({
		babelrc: false,
		include: [
			`${__dirname}/**`,
			`${ctx.config.root}/**`,
			`${ctx.cachedir}/**`,
		],
		extensions,
		...config(ctx, server, modern, plugins),
	})
}

export function config (ctx : Compilation, server : boolean, modern : boolean, plugins : mixed[] = []) : mixed {
	const targets =
		server
			? { node: true }
			: modern
				? { esmodules: true }
				: {}

	return {
		presets: [
			[
				"@babel/preset-env",
				{
					// modules: false,
					useBuiltIns: "usage",
					corejs: 3,
					targets,
				},
			],
			"@babel/preset-react",
			[
				"@babel/preset-flow",
				{
					all: true,
				},
			],
		],
		plugins: [
			"babel-plugin-transform-dirname-filename",
			"@babel/plugin-syntax-dynamic-import",
			...plugins,
			"@babel/plugin-proposal-optional-chaining",
			// TODO: add again when we can import non local types
			// ...ctx.config.dev ? [ "babel-plugin-flow-react-proptypes" ] : [],
			[
				"babel-plugin-module-resolver",
				{
					extensions,
					alias: {
						[`${name}/server`]: path.resolve(__dirname, "lib/server"),
						[`${name}/head`]: path.resolve(__dirname, "lib/head"),
						[`${name}/validate`]: path.resolve(__dirname, "lib/validate"),
						[`${name}/hooks`]: path.resolve(__dirname, "lib/hooks"),
						[name]:
							server
								? path.resolve(__dirname, "lib/server")
								: path.resolve(__dirname, "lib/client"),
					},
				},
			],
		],
	}
}
