/**
 * Trade codes — encode a collectible critter into a short, copy-pasteable
 * string an engineer can drop in Slack/email, and decode it back. Fully
 * offline (no backend), so it preserves Timelog's local-only posture.
 *
 * A code is `base64url(payload) + "." + checksum`, where payload is a compact
 * JSON array of the variant's fields. The checksum catches typos/truncation and
 * deters casual forgery; it is not cryptographic. Pure + DOM-free (uses
 * TextEncoder/TextDecoder, available in node + the renderer) so it is testable.
 */
import type { Habitat, Rarity, SpriteAccessory, SpritePattern, SpriteVariant } from './types'
import { HABITATS, speciesById } from './species'

const RARITIES_C: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const PATTERNS_C: SpritePattern[] = ['spots', 'stripes', 'patch']
const ACCESSORIES_C: SpriteAccessory[] = ['scarf', 'cap', 'glasses']

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const HEX = /^[0-9a-fA-F]{6}$/

function bytesToB64url(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : -1
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : -1
    out += B64[b0 >> 2]
    out += B64[((b0 & 3) << 4) | (b1 >= 0 ? b1 >> 4 : 0)]
    if (b1 >= 0) out += B64[((b1 & 15) << 2) | (b2 >= 0 ? b2 >> 6 : 0)]
    if (b2 >= 0) out += B64[b2 & 63]
  }
  return out
}

function b64urlToBytes(str: string): Uint8Array | null {
  const lookup = new Map<string, number>()
  for (let i = 0; i < B64.length; i++) lookup.set(B64[i], i)
  const bytes: number[] = []
  for (let i = 0; i < str.length; i += 4) {
    const c0 = lookup.get(str[i])
    const c1 = lookup.get(str[i + 1])
    if (c0 === undefined || c1 === undefined) return null
    const c2 = lookup.get(str[i + 2])
    const c3 = lookup.get(str[i + 3])
    bytes.push((c0 << 2) | (c1 >> 4))
    if (c2 !== undefined) {
      bytes.push(((c1 & 15) << 4) | (c2 >> 2))
      if (c3 !== undefined) bytes.push(((c2 & 3) << 6) | c3)
    }
  }
  return new Uint8Array(bytes)
}

/** Tiny non-cryptographic checksum (djb2 → base36, 4 chars). */
function checksum(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36).slice(-4).padStart(4, '0')
}

/** Encode a critter into a shareable trade code. */
export function encodeVariant(v: SpriteVariant): string {
  const payload = JSON.stringify([
    1,
    v.species,
    v.habitat,
    RARITIES_C.indexOf(v.rarity),
    v.shiny ? 1 : 0,
    v.pattern ? PATTERNS_C.indexOf(v.pattern) : -1,
    v.accessory ? ACCESSORIES_C.indexOf(v.accessory) : -1,
    v.palette.body.replace('#', ''),
    v.palette.accent.replace('#', ''),
    v.palette.eye.replace('#', ''),
    v.seed
  ])
  const body = bytesToB64url(new TextEncoder().encode(payload))
  return `${body}.${checksum(body)}`
}

function hex(s: unknown): string | null {
  return typeof s === 'string' && HEX.test(s) ? `#${s.toLowerCase()}` : null
}

/** Decode a trade code back into a critter, or `null` if malformed/corrupt. */
export function decodeVariant(code: string): SpriteVariant | null {
  const trimmed = code.trim()
  const dot = trimmed.lastIndexOf('.')
  if (dot <= 0) return null
  const body = trimmed.slice(0, dot)
  if (checksum(body) !== trimmed.slice(dot + 1)) return null

  const bytes = b64urlToBytes(body)
  if (!bytes) return null
  let arr: unknown
  try {
    arr = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
  if (!Array.isArray(arr) || arr[0] !== 1 || arr.length < 11) return null

  const [, species, habitat, rarityIdx, flags, patIdx, accIdx, body6, accent6, eye6, seed] =
    arr as unknown[]

  const palBody = hex(body6)
  const palAccent = hex(accent6)
  const palEye = hex(eye6)
  if (
    typeof species !== 'string' ||
    !species ||
    typeof seed !== 'string' ||
    !palBody ||
    !palAccent ||
    !palEye ||
    typeof rarityIdx !== 'number' ||
    !RARITIES_C[rarityIdx]
  ) {
    return null
  }

  const hab: Habitat =
    typeof habitat === 'string' && (HABITATS as string[]).includes(habitat)
      ? (habitat as Habitat)
      : (speciesById(species)?.habitat ?? 'home')

  const pattern = typeof patIdx === 'number' && patIdx >= 0 ? PATTERNS_C[patIdx] : undefined
  const accessory = typeof accIdx === 'number' && accIdx >= 0 ? ACCESSORIES_C[accIdx] : undefined

  return {
    species,
    habitat: hab,
    palette: { body: palBody, accent: palAccent, eye: palEye },
    pattern,
    accessory,
    shiny: flags === 1 ? true : undefined,
    rarity: RARITIES_C[rarityIdx],
    seed
  }
}

/** Convenience guard. */
export function isValidCode(code: string): boolean {
  return decodeVariant(code) !== null
}
