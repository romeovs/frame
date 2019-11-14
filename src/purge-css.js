import Purgecss from "purgecss"

type CSS = {
	type : "css",
	content : string,
	src : string,
}

export function purge (ctx : Compilation, markup : string, css : CSS[]) : string {
	const purgecss = new Purgecss({
		css: [{
			raw: css.map(asset => clean(asset.content)).join("\n"),
			extension: "css",
		}],
		content: [{
			raw: markup,
			extension: "html",
		}],
	})

	return purgecss.purge().map(file => file.css).join("")
}

function clean (content : string) : stirng {
	return content.replace(/\/\*#[^\/]+\*\//g, "")
}
