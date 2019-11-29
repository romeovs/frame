import slugify from "@sindresorhus/slugify"

export function slug (str : string) : string {
	return slugify(str, {
		lowercase: true,
	})
}
