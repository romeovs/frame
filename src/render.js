import DOM from "react-dom/server"

export function render (ctx, component) {
	return DOM.renderToString(component)
}
