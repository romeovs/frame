import crypto from "crypto"
import base from "base-x"

const HASH_LEN = 8

// A url-safe encoding alphabet
const alphabet = "_-0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
const encoding = base(alphabet)

export function hash (data : string | Buffer) : string {
	const md5 = crypto.createHash("md5")
	const digest = md5.update(data).digest()
	return encoding.encode(digest).substring(0, HASH_LEN)
}
