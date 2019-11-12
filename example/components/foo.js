import React from "react"
import styles from "./foo.css"

export default function Foo (props) : React.Node {
	return (
		<div className={styles.foo}>
			Foo
		</div>
	)
}
