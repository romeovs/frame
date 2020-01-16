import * as React from "react"
import styles from "./foo.css"

import { Link as A } from "react-router-dom"
import { Title, Link, Meta } from "@romeovs/frame/head"

export type FooProps = {
	init : number,
}

export default function Foo (props : FooProps) : React.Node {
	const [ title, setTitle ] = React.useState("Foo")

	return (
		<div>
			<Link rel="stylesheet" href="ok.com/css" />
			<Title>DOPE</Title>
			<Title>{title}</Title>

			<Meta name="foo" value="first" />
			<Meta name="foo" value="second" />

			<label>
				Title: <input value={title} onChange={evt => setTitle(evt.target.value)} />
			</label>
			<div className={styles.foo}>
				Foo: <pre>2 * {props.init} = {2 * props.init}</pre>
			</div>
			<A to="/">Home</A>
			<A to="/foo">Foo</A>
		</div>
	)
}
