import Purgecss from "purgecss"

export function purge (ctx : Compilation, markup : string, css : string) : string {
	const purgecss = new Purgecss({
		css: [{
			raw: css,
			extension: "css",
		}],
		content: [{
			raw: markup,
			extension: "html",
		}],
	})

	return purgecss.purge().map(file => file.css).join("")
}
