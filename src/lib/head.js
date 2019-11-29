/* global document window */
/* eslint-disable react/no-unused-prop-types */

import * as React from "react"
import DOM from "react-dom"

const context = React.createContext()

type ProviderProps = {
	tags : React.Element<Tag>[],
	children : React.Node,
}

type ID = number

type TagName = TagProps.name

type TagDefn = {
	id : ID,
	name : TagName,
	props : TagProps.props,
}

function cascades (tag : TagName) : boolean {
	return tag === "title" || tag === "meta"
}

export function HeadProvider (props : ProviderProps) : React.Node {
	const [ tags, setTags ] = React.useState([])

	function add (id : ID, name : TagName, p : TagProps.props) : ID {
		// TODO: replace the tag if it exists
		setTags(function (old : TagDefn[]) : TagDefn[] {
			const updated = [ ...old ]
			const idx = updated.findIndex(t => t.id === id)
			updated[idx === -1 ? updated.length : idx] = { id, name, props: p }
			return updated
		})

		if (props.tags) {
			const idx = props.tags.findIndex(t => t.id === id) || props.tags.length
			props.tags[idx === -1 ? props.tags.length : idx] = { id, name, props: p }
		}
	}

	function remove (id : ID) {
		setTags(old => old.filter(tag => tag.id !== id))

		// Remove tag from props.tags
		if (props.tags) {
			const idx = props.tags.findIndex(t => t.id === id)
			if (idx !== -1) {
				props.tags[idx] = null
			}
		}
	}

	const ctx = { add, remove }

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
			meta.nextSibling.remove()
		}
	}, [])

	if (typeof document === "undefined") {
		return null
	}

	const head = props.tags.map(t => (
		<Tag
			key={t.id}
			name={t.name}
			props={t.props}
		/>
	))

	return DOM.createPortal(head, document.head)
}

export function RenderServer (props : RenderProps) : React.Node {
	if (typeof window !== "undefined") {
		return null
	}

	const { tags } = props
	const head =
		tags
			.filter(t => Boolean(t))
			.map(t => <Tag key={t.id} name={t.name} props={t.props} />)

	if (head.length === 0) {
		return null
	}

	return (
		<>
			<meta name={metaName} value={head.length} />
			{head}
		</>
	)
}

function Tag (props : TagProps) : React.Node {
	const { name: Component, props: p } = props
	return <Component {...p} />
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
	useRegisterTag(props.name, props.props)
	return <Tag {...props} />
}

function useRegisterTag (name : TagName, props : TagProps.props) {
	// Generate an id
	const ctx = React.useContext(context)
	if (!ctx) {
		throw new Error("HeadProvider not found")
	}

	const id = useID()
	React.useEffect(function () : () => void {
		// Add the first render
		ctx.add(id, name, props)

		// Remove the tag on unmount
		return () => ctx.remove(id)
	}, [])

	React.useEffect(function () {
		// replace the tag on changes
		ctx.add(id, name, props)
	}, [ name, ...Object.values(props) ])


	if (typeof window === "undefined") {
		// Add on render in SSR
		ctx.add(id, name, props)
	}
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
	return <HeadTag name="style" props={props} />
}

export function Title (props : TitleProps) : React.Node {
	return <HeadTag name="title" props={props} />
}
