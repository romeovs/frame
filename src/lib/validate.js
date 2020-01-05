/* eslint-disable flowtype/no-weak-types */
import path from "path"

import { type Asset, type YAMLAsset, type ImageAsset, type MarkdownAsset, type JSONAsset, type TextAsset, type HTMLAsset, type PDFAsset } from "../assets"
import { type ImageFormat } from "../config"
import { asset } from "./server"

export type Validate<T> = (ctx : string, x : any) => T
export type ValidateAsset<T> = (ctx : string, x : Asset) => T

export class ValidationError extends Error {
	ctx : string
	message : string
	value : any

	constructor (ctx : string, x : any, message : string) {
		super(`${ctx}: ${message}, got ${JSON.stringify(x)}`)
		this.ctx = ctx
		this.value = x
	}
}

function err (ctx : string, x : any, message : string) : ValidationError {
	return new ValidationError(ctx, x, message)
}

export function string (ctx : string, x : any) : string {
	if (typeof x !== "string") {
		throw err(ctx, x, "expected a string")
	}
	return x
}

export function number (ctx : string, x : any) : number {
	if (typeof x !== "number") {
		throw err(ctx, x, "expected a number")
	}
	return x
}

export function boolean (ctx : string, x : any) : boolean {
	if (typeof x !== "boolean") {
		throw err(ctx, x, "expected a boolean")
	}
	return x
}

export function object (ctx : string, x : any) : { ... } {
	if (typeof x !== "object" || !x) {
		throw err(ctx, x, "expected an object")
	}
	return x
}

export function array (ctx : string, x : any) : any[] {
	if (!Array.isArray(x)) {
		throw err(ctx, x, "expected an array")
	}
	return x
}

type ExtractReturnType = <T>(Validate<T>) => T

export function shape<O : {[key : string] : Function, ... }> (getters : O) : Validate<$ObjMap<O, ExtractReturnType>> {
	return function (ctx : string, x : any) : $ObjMap<O, ExtractReturnType> {
		const obj = object(ctx, x)

		const res : $ObjMap<O, ExtractReturnType> = {}
		for (const key in getters) {
			const validator = getters[key]
			res[key] = validator(`${ctx}.${key}`, obj[key])
		}

		return res
	}
}

export function tuple<A : Function[]> (...getters : A) : Validate<$TupleMap<A, ExtractReturnType>> {
	return function (ctx : string, x : any) : $TupleMap<A, ExtractReturnType> {
		const arr = array(ctx, x)

		const res = []
		for (let i = 0; i < arr.length; i++) {
			res[i] = getters[i](`${ctx}[${i}]`, arr[i])
		}

		return res
	}
}

export function value<T> (v : T) : (string, any) => T {
	return function (ctx : string, x : any) : T {
		if (x !== v) {
			if (v !== undefined) {
				throw err(ctx, x, `expected ${JSON.stringify(v)}`)
			}
			throw err(ctx, x, "expected undefined")
		}
		return v
	}
}

export function maybe<T> (validator : (string, any) => T) : (string, any) => ?T {
	return function (ctx : string, x : any) : ?T {
		if (x === null || x === undefined) {
			return x
		}
		return validator(ctx, x)
	}
}

export function imageFormat (ctx : string, x : any) : ImageFormat {
	if (x !== "webp" && x !== "png" && x !== "jpeg" && x !== "tiff" && x !== "gif") {
		throw err(ctx, x, "expected a valid image format")
	}
	return x
}

export const image : ValidateAsset<ImageAsset> = shape({
	id: string,
	type: value("image"),
	width: number,
	height: number,
	matrix: array,
	color: maybe(string),
	gradient: maybe(string),
	formats: arrayOf(imageFormat),
})

export const text : ValidateAsset<TextAsset> = shape({
	id: string,
	type: value("text"),
	content: string,
})

export const html : ValidateAsset<HTMLAsset> = shape({
	id: string,
	type: value("html"),
	content: string,
})

export const pdf : ValidateAsset<PDFAsset> = shape({
	id: string,
	type: value("pdf"),
	url: string,
})

export function yaml (ctx : string, x : Asset) : YAMLAsset {
	if (x.type !== "yaml") {
		throw err(ctx, x, "expected a yaml asset")
	}
	return x
}

export function yamlOf<T> (v : Validate<T>) : ValidateAsset<T> {
	return function (ctx : string, x : any) : T {
		const y = yaml(ctx, x)
		return v(ctx, y.content)
	}
}

export function json (ctx : string, x : Asset) : JSONAsset {
	if (x.type !== "json") {
		throw err(ctx, x, "expected a json asset")
	}
	return x
}

export function jsonOf<T> (v : Validate<T>) : ValidateAsset<T> {
	return function (ctx : string, x : Asset) : T {
		const y = json(ctx, x)
		return v(ctx, y.content)
	}
}

export function markdown (ctx : string, x : Asset) : MarkdownAsset {
	if (x.type !== "markdown") {
		throw err(ctx, x, "expected a markdown asset")
	}
	return x
}

export function arrayOf<T> (type : Validate<T>) : Validate<T[]> {
	return function (ctx : string, x : any) : T[] {
		const arr = array(ctx, x)
		return arr.map((y, i) => type(`${ctx}[${i}]`, y))
	}
}

export type typeOf<T : Validator<X>> = X

export async function readAs<T> (v : ValidateAsset<T>, ...segments : string[]) : Promise<T> {
	const pth = path.join(...segments)
	const a = await asset(pth)
	return v(`(${pth})`, a)
}

// export function or <T> (...v : Validate<T>) : Validate<T> {
// 	return function (ctx : string, x : any) : T {
// 		for (const validate of v) {
// 			try {
// 				return validate(x)
// 			} catch (e) {
// 				continue
// 			}
// 		}
//
// 		throw err(ctx, x, "does not match any of its validators")
// 	}
// }
//
// const imageFormat = or(
// value("webp"),
// value("jpeg"),
// value("png"),
// value("tiff"),
// value("gif"),
// )
