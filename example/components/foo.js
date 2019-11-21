import * as React from "react"
import styles from "./foo.css"

export type FooProps = {
	init : number,
}

export default function Foo (props : FooProps) : React.Node {
	return (
		<div className={styles.foo}>
			Foo: <pre>2 * {props.init} = {2 * props.init}</pre>
		</div>
	)
}
