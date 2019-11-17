import path from "path"
import babelPlugin from "rollup-plugin-babel"

const extensions = [ ".js" ]

export function babel (ctx : Comilation, server : boolean, modern : boolean) : babelPlugin {
	return babelPlugin({
		babelrc: false,
		exclude: "node_modules/**",
		extensions,
		...config(ctx, server, modern),
	})
}

export function config (ctx : Compilation, server : boolean, modern : boolean) {
	const targets =
		server
	 		? { node: true }
			: modern
				? { esmodules: true }
				: ctx.config.browsers

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
			"@babel/preset-flow",
		],
		plugins: [
			"babel-plugin-transform-dirname-filename",
			"@babel/plugin-syntax-dynamic-import",
			"@babel/plugin-proposal-optional-chaining",
			...ctx.config.dev ? [] : [ "babel-plugin-flow-react-proptypes" ],
			[
				"babel-plugin-module-resolver",
				{
					extensions,
					alias: {
						"frame/server": path.resolve(__dirname, "es/lib/server"),
						"frame":
							server
								? path.resolve(__dirname, "es/lib/server")
								: path.resolve(__dirname, "es/lib/client"),
					},
				},
			],
		],
	}
}
