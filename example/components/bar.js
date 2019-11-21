import * as React from "react"
import styles from "./bar.css"

export type BarProps = {
	title : string,
}

export default function Bar (props : BarProps) : React.Node {
	return (
		<div className={styles.bar}>
			Bar: {props.title}
		</div>
	)
}
