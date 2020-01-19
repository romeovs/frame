/* global document window */
/* eslint-disable react/no-unused-prop-types */

import * as React from "react"
import DOM from "react-dom"

const context = React.createContext()

type ProviderProps = {
	tags : React.Element<any>[],
	children : React.Node,
}

type ID = number

type TagName = TagProps.name

type TagDefn = {
	id : ID,
	name : TagName,
	props : TagProps.props,
}

// Imperatively update tags to contain the new tag.
function update (tags : ?TagDefn[], id : ID, name : TagName, props : TagProps.props) : TagDefn[] {
	if (!tags) {
		return tags
	}

	const idx = tags.findIndex(t => t && t.id === id)
	tags[idx === -1 ? tags.length : idx] = { id, name, props }
	return tags
}

// Imperatively remove the tags with the specified id.
function remove (tags : ?TagDefn[], id : ID) : TagDefn[] {
	if (!tags) {
		return tags
	}

	const idx = tags.findIndex(t => t && t.id === id)
	if (idx !== -1) {
		tags[idx] = null
	}

	return tags
}

export function HeadProvider (props : ProviderProps) : React.Node {
	const [ tags, setTags ] = React.useState([])

	const ctx = {
		// Add or update a tag
		add (id : ID, name : TagName, p : TagProps.props) : ID {
			setTags(old => update([ ...old ], id, name, p))
			update(props.tags, id, name, p)
		},

		// Remove the specified tag
		remove (id : ID) {
			setTags(old => remove([ ...old ], id))
			remove(props.tags, id)
		},
	}

	return (
		<context.Provider value={ctx}>
			<RenderClient tags={tags} />
			{props.children}
		</context.Provider>
	)
}

type RenderProps = {
	tags : TagDefn[],
}

const metaName = "head-count"

function RenderClient (props : RenderProps) : React.Node {
	React.useEffect(function () {
		if (typeof document === "undefined") {
			return
		}

		// Remove SSR tags
		const meta = document.querySelector(`meta[name=${metaName}]`)
		if (!meta) {
			return
		}

		const count = parseInt(meta.attributes.value.value, 10)
		for (let i = 0; i < count; i++) {
			try {
				meta.nextSibling.remove()
			} catch (err) {
				continue
			}
		}
	}, [])

	if (typeof document === "undefined") {
		return null
	}

	return DOM.createPortal(render(props.tags), document.head)
}

export function RenderServer (props : RenderProps) : React.Node {
	if (typeof window !== "undefined") {
		throw new Error("frame/head: Calling RenderServer on the client")
	}

	const head = render(props.tags)
	if (!head || head.length === 0) {
		return null
	}

	return (
		<>
			<meta name={metaName} value={head.length} />
			{head}
		</>
	)
}

function render (tags : TagDefn[]) : React.Node {
	if (tags.length === 0) {
		return null
	}

	return collapse(tags).map(t => <t.name key={t.id} {...t.props} />)
}

// Collapse all cascading tags into one, only keeping the last one.
function collapse (tags : TagDefn[]) : TagDefn[] {
	const res = []

	let hasTitle = false
	const hasMeta = {}

	for (let i = tags.length - 1; i >= 0; i--) {
		const tag = tags[i]

		if (!tag) {
			continue
		}

		if (tag.name === "title") {
			if (!hasTitle) {
				hasTitle = true
				res.unshift(tag)
			}
			continue
		}

		if (tag.name === "meta") {
			if (!hasMeta[tag.props.name]) {
				hasMeta[tag.props.name] = true
				res.unshift(tag)
			}
			continue
		}

		res.unshift(tag)
	}

	return res
}

type LinkProps = {
	rel : string,
	href : string,
	...,
}

type MetaProps = {
	name : string,
	content : string,
	...,
}

type StyleProps = {
	children : string,
}

type TitleProps = {
	children : React.Node,
}

type TagProps = { tag : "link", props : LinkProps }
	| { name : "meta", props : MetaProps }
	| { name : "style", props : StyleProps }
	| { name : "title", props : TitleProps }

function HeadTag (props : TagProps) : React.Node {
	// Generate an id
	const ctx = React.useContext(context)
	if (!ctx) {
		throw new Error("HeadProvider not found")
	}

	const id = useID()
	React.useEffect(function () : () => void {
		// Add the first render
		ctx.add(id, props.name, props.props)

		// Remove the tag on unmount
		return () => ctx.remove(id)
	}, [])

	React.useEffect(function () {
		// replace the tag on changes
		ctx.add(id, props.name, props.props)
	}, [ props.name, ...Object.values(props.props) ])


	if (typeof window === "undefined") {
		// Add on render in SSR
		ctx.add(id, props.name, props.props)
	}

	return null
}

let id = 1
function useID () : ID {
	const [ r ] = React.useState(id++)
	return r
}

export function Link (props : LinkProps) : React.Node {
	return <HeadTag name="link" props={props} />
}

export function Meta (props : MetaProps) : React.Node {
	return <HeadTag name="meta" props={props} />
}

export function Style (props : StyleProps) : React.Node {
	const { children } = props
	const p = { dangerouslySetInnerHTML: { __html: children }}
	return <HeadTag name="style" props={p} />
}

export function Title (props : TitleProps) : React.Node {
	return <HeadTag name="title" props={props} />
}
