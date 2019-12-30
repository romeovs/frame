import path from "path"
import { spawn } from "child_process"

import fs from "./fs"
import { type Compilation } from "./compilation"
import { type Manifest } from "./manifest"

export async function robots (ctx : Compilation, manifest : Manifest, sitemap : string) {
	try {
		const txt = path.resolve(ctx.config.root, "robots.txt")
		const template = await fs.readFile(txt, "utf-8")
		const content = template.replace(/{sitemap}/, manifest.hostname + sitemap)
		await ctx.write("robots.txt", content)
	} catch {
		// noop
	}
}

export async function humans (ctx : Compilation) {
	try {
		const txt = path.resolve(ctx.config.root, "humans.txt")
		const content = await fs.readFile(txt, "utf-8")
		await ctx.write("humans.txt", content)
	} catch {
		// noop
	}
}

export type Security = {
	// A link or e-mail address for people to contact you about security issues. Remember to include "https://" for URLs, and "mailto:" for e-mails.
	contact : string[],

	// A link to a key which security researchers should use to securely talk to you. Remember to include "https://".
	encryption? : string[],

	// A link to a web page where you say thank you to security researchers who have helped you
	acknowledgements? : string[],

	// A comma-separated list of language codes that your security team speaks.
	languages? : string[],

	// A link to a policy detailing what security researchers should do when searching for or reporting security issues.
	policy? : string[],

	// A link to any security-related job openings in your organisation. Remember to include "https://".
	hiring? : string[],

	// Wether or not to sign the key, defaults to true
	sign : boolean,
}

export async function security (ctx : Compilation, manifest : Manifest) {
	const { security = null } = manifest
	if (!security) {
		return
	}

	const {
		contact,
		encryption = [],
		acknowledgements = [],
		policy = [],
		hiring = [],
		languages = [],
		sign = true,
	} = security

	let content = "# Report security issues here.\n"

	for (const item of all(contact)) {
		if (!item.startsWith("https://") && !item.startsWith("mailto:")) {
			throw new Error(`Invalid security.contact: Links must include https:// or mailto, got '${item}'`)
		}
		content += `Contact: ${item}\n`
	}

	if (manifest.hostname) {
		content += `Canonical: ${manifest.hostname}/.well-known/security.txt\n`
	}

	for (const item of all(encryption)) {
		if (!item.startsWith("https://") && !item.startsWith("dns:") && !item.startsWith("openpgp4fpr:")) {
			throw new Error(`Invalid security.encryption: Keys must include https://, keys must include dns: or openpgp4fpr:, got '${item}'`)
		}
		content += `Encryption: ${item}\n`
	}

	for (const item of all(acknowledgements)) {
		if (!item.startsWith("https://")) {
			throw new Error(`Invalid security.acknowledgements: Links must include https://, got '${item}'`)
		}
		content += `Acknowledgements: ${item}\n`
	}

	for (const item of all(policy)) {
		if (!item.startsWith("https://")) {
			throw new Error(`Invalid security.policy: Links must include https://, got '${item}'`)
		}
		content += `Policy: ${item}\n`
	}

	for (const item of all(hiring)) {
		if (!item.startsWith("https://")) {
			throw new Error(`Invalid security.hiring: Links must include https://, got '${item}'`)
		}
		content += `Hiring: ${item}\n`
	}

	if (all(languages).length > 0) {
		content += `Preferred-Languages: ${all(languages).join(", ")}\n`
	}

	if (sign) {
		if (!manifest.hostname) {
			throw new Error("Cannot sign security.txt without hostname")
		}

		ctx.log("Signing security.txt")
		content = await gpgsign(content)
	}

	await ctx.write("/.well-known/security.txt", content)
}

function gpgsign (cleartext : string) : Promise<string> {
	return new Promise(function (resolve : string => void, reject : Error => void) {
		const child = spawn("gpg", [ "--clearsign", "--digest-algo", "SHA512" ])

		let resp = ""
		child.on("exit", function (code : number) {
			if (code !== 0) {
				reject(new Error(`Could not sign security.txt: got exit code ${code}`))
				return
			}

			resolve(resp)
		})

		child.on("error", function (err : Error) {
			reject(err)
		})

		child.stdout.on("data", function (data : Buffer | string) {
			resp += data.toString()
		})

		child.stdin.setEncoding = "utf-8"
		child.stdin.write(cleartext)
		child.stdin.end()
	})
}

function all (x : string | string[] | void | null) : string[] {
	if (x === undefined || x === null) {
		return []
	}

	if (typeof x === "string") {
		return [ x ]
	}

	return x
}
