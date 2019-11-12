import path from "path"

export function plugin (babel : mixed) : mixed {
	return {
		visitor: {
			ImportDeclaration (pth : string, state : mixed) {
				const { filename } = state.file.opts
				const { value } = pth.node.source
				if (!value || !value.startsWith(".")) {
					return
				}

				const dir = path.dirname(filename)
				const full = path.resolve(dir, value)

				const ast = babel.template.expression.ast`global._frame_asset("${full}")`
				pth.insertAfter(ast)
			},
			Import (pth : string, state : mixed) {
				const { filename } = state.file.opts
				const { value } = pth.container.arguments[0]

				if (!value || !value.startsWith(".")) {
					return
				}

				if (pth.parentPath.parent.type === "SequenceExpression") {
					return
				}

				const dir = path.dirname(filename)
				const full = path.resolve(dir, value)

				const ast = babel.template(`(global._frame_asset("FULL"), import("VALUE"))`, {
					plugins: [ "dynamicImport" ],
				})({
					FULL: full,
					VALUE: value,
				})

				pth.parentPath.replaceWith(ast)
			},
		},
	}
}
