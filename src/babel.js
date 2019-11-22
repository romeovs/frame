import path from "path"
import babelPlugin from "rollup-plugin-babel"

import { type Compilation } from "./compilation"

const extensions = [ ".js" ]

export function babel (ctx : Compilation, server : boolean, modern : boolean, plugins : mixed[] = []) : babelPlugin {
	return babelPlugin({
		babelrc: false,
		exclude: "node_modules/**",
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
			...ctx.config.dev ? [] : [ "babel-plugin-flow-react-proptypes" ],
			[
				"babel-plugin-module-resolver",
				{
					extensions,
					alias: {
						"frame/server": path.resolve(__dirname, "lib/server"),
						"frame":
							server
								? path.resolve(__dirname, "lib/server")
								: path.resolve(__dirname, "lib/client"),
					},
				},
			],
		],
	}
}
