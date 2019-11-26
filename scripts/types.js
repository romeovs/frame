import path from "path"
import { promises as fs } from "fs"

import resolve from "resolve"
import * as parser from "@babel/parser"
import traverse from "@babel/traverse"
import generate from "@babel/generator"

async function main () {
	const name = process.argv[2]
	const file = process.argv[3]

	const files = new Set([ file ])
	const done = new Set()
	const exports = new Set()
	let types = {}
	let first = true

	for (;;) {
		if (files.size === 0) {
			break
		}

		const file = Array.from(files.values())[0]
		if (!file) {
			break
		}
		files.delete(file)

		if (done.has(file)) {
			continue
		}

		const r = await loop(file)
		r.imports.forEach(x => files.add(x))

		types = { ...r.types, ...types }
		if (first) {
			r.exports.forEach(x => exports.add(x))
			first = false
		}

		done.add(file)
	}

	const code =
		Object.keys(types)
			.map(function (name : string) : string {
				const t = types[name]
				if (exports.has(name)) {
					if (t.startsWith("function") || t.startsWith("async function")) {
						return `declare ${t}`.replace("async function", "function")
					}
					return `declare ${t}`
				}

				if (t.startsWith("function") || t.startsWith("async function")) {
					return null
				}

				return `declare ${t}`.replace("const", "var")
			})
			.filter(x => Boolean(x))
			.join("\n\n")

	console.log(`declare module "${name}" {\n${code}\n}`)
}

main().catch(err => console.error(err))

async function loop (file : string) : Promise<Types> {
	const code = await read(file)
	const ast = parser.parse(code, {
		sourceType: "module",
		sourceFilename: file,
		plugins: [
			"flow",
			"jsx",
			"optionalChaining",
		],
	})

	const types = {}
	const imports = new Set()
	const exports = new Set()
	const packages = new Set()

	traverse(ast, {
		TypeAlias (pth) {
			const { name } = pth.node.id
			if (name in types) {
				return
			}

			types[name] = generate(pth.node).code
		},

		ExportSpecifier (pth) {
			exports.add(pth.node.local.name)
		},

		ExportNamedDeclaration (pth) {
			const { declaration } = pth.node
			if (!declaration) {
				return
			}

			const {
				id: { name } = {},
			} = declaration

			if (declaration.type !== "FunctionDeclaration") {
				return
			}

			declaration.body = null

			exports.add(name)

			if (name in types) {
				return
			}

			types[name] = generate(declaration).code.replace("export ", "declare ")
			if (types[name].endsWith(")")) {
				types[name] += ": void"
			}
		},

		ImportDeclaration (pth) {
			const relative = pth.node.source.value
			if (relative[0] !== ".") {
				packages.add(relative)
				return
			}

			const abs = resolve.sync(relative, {
				basedir: path.dirname(file),
			})
			imports.add(abs)
		},
	})

	return { exports, types, imports, packages }
}

async function read (file : string) : Promise<string> {
	try {
		return await fs.readFile(file, "utf-8")
	} catch (err) {
		try {
			return await fs.readFile(path.join(file, "index.js"), "utf-8")
		} catch (err) {
			try {
				return await fs.readFile(`${file}.js`, "utf-8")
			} catch (err) {
				throw Error(`Cannot find module ${file}: ${err}`)
			}
		}
	}
}
