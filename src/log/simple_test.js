import { Buffered } from "../stream"

import { SimpleLogger } from "./simple"

test("SimpleLogger should work with simple messages", function () {
	const buf = new Buffered()
	const logger = new SimpleLogger(buf)
	logger._timer = { elapsed: 342 }

	logger.log("Foo")
	expect(buf.toString()).toBe("INFO     342 Foo\n")
})

test("SimpleLogger should work with complex arguments", function () {
	const buf = new Buffered()
	const logger = new SimpleLogger(buf)
	logger._timer = { elapsed: 342 }

	logger.debug("Foo %s %3.1f", "bar", 55.6)
	expect(buf.toString()).toBe("DEBUG    342 Foo bar 55.6\n")
})
