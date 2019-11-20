import { compress, decompress } from "./compress"
import { impath } from "./constants"

const image = {
	type: "image",
	id: "abcdefgh",
	formats: [
		"jpeg",
		"webp",
	],
	matrix: [
		`/${impath}/abcde/200.aaaa.jpeg`,
		`/${impath}/abcde/500.aaaa.jpeg`,
		`/${impath}/abcde/200.aaaa.webp`,
		`/${impath}/abcde/500.aaaa.webp`,
	],
	height: 500,
	width: 2000,
	color: "#aaabbb",
}

const examples = [
	null,
	undefined,
	"Hello World!",
	-1,
	0,
	Math.random(),
	-Math.random(),
	true,
	false,
	{ x: 1 },
	{ id: 12 },
	image,
	[ 12, image ],
]

test("compression should not be lossy", function () {
	for (const example of examples) {
		const c = compress(example)
		const d = decompress(c)
		expect(d).toEqual(example)
	}
})

test("compression should reduce the overall size", function () {
	for (const example of examples) {
		const original = JSON.stringify(example)?.length || 0
		const compressed = JSON.stringify(compress(example))?.length || 0
		expect(compressed).toBeLessThanOrEqual(original)
	}
})
