// VIBE-CHECK-03 — short, URL-safe token generator for `shortId`/`referralCode`.
// No id-generation library exists in api's deps (checked package.json — no
// nanoid/uuid-short/etc.), and pulling one in for a single short-token use case
// felt heavier than needed, so this is a small `node:crypto`-backed generator
// instead. Alphabet drops visually-ambiguous characters (0/O, 1/l/I) since
// these tokens are meant to be typed/shared, not just pasted as links.
import { randomInt } from 'node:crypto'

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ'

/** `randomInt` is rejection-sampled internally (no modulo bias) and CSPRNG-backed. */
export function generateToken(length: number): string {
  let token = ''
  for (let i = 0; i < length; i++) {
    token += ALPHABET[randomInt(ALPHABET.length)]
  }
  return token
}
