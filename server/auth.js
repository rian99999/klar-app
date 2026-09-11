import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

/**
 * Staff authentication for the KLAR server.
 *
 * Passwords never reach the client bundle (the old VITE_ADMIN_PASSCODE did),
 * and the session lives in a signed httpOnly cookie the page script cannot read.
 */

const SESSION_COOKIE = 'klar_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12h
const SCRYPT_KEYLEN = 64

/** Attempts allowed per IP inside the window before lockout. */
const MAX_ATTEMPTS = 8
const ATTEMPT_WINDOW_MS = 1000 * 60 * 10

function readEnvPassword() {
  const staff = process.env.KLAR_PASSWORD
  if (!staff) return null
  return { staff, admin: process.env.KLAR_ADMIN_PASSWORD || staff }
}

/**
 * Dev fallback so `npm run dev` works on a fresh clone. Production refuses to
 * start without a real password rather than shipping a known default.
 */
const DEV_PASSWORD = 'klar-dev'

export function resolvePasswords({ isProduction }) {
  const fromEnv = readEnvPassword()
  if (fromEnv) return { ...fromEnv, isDefault: false }
  if (isProduction) {
    throw new Error(
      'KLAR_PASSWORD is not set. Set it before starting the server in production.',
    )
  }
  return { staff: DEV_PASSWORD, admin: DEV_PASSWORD, isDefault: true }
}

/**
 * The signing secret. A generated one is fine for a single instance; it just
 * means sessions are dropped on restart, so we say so at boot.
 */
export function resolveSessionSecret() {
  const fromEnv = process.env.KLAR_SESSION_SECRET
  if (fromEnv) return { secret: fromEnv, ephemeral: false }
  return { secret: randomBytes(32).toString('hex'), ephemeral: true }
}

function constantTimeEquals(a, b) {
  const bufA = Buffer.from(String(a), 'utf8')
  const bufB = Buffer.from(String(b), 'utf8')
  // timingSafeEqual throws on length mismatch, so compare fixed-size digests.
  const digestA = scryptSync(bufA, 'klar-compare', SCRYPT_KEYLEN)
  const digestB = scryptSync(bufB, 'klar-compare', SCRYPT_KEYLEN)
  return timingSafeEqual(digestA, digestB)
}

export function verifyPassword(candidate, expected) {
  if (typeof candidate !== 'string' || candidate.length === 0) return false
  if (candidate.length > 512) return false
  return constantTimeEquals(candidate, expected)
}

/* ------------------------------ sessions ------------------------------ */

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function createSessionToken({ role, secret }) {
  const payload = Buffer.from(
    JSON.stringify({ role, exp: Date.now() + SESSION_TTL_MS }),
    'utf8',
  ).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

export function readSessionToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = sign(payload, secret)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data?.exp !== 'number' || data.exp < Date.now()) return null
    return { role: data.role === 'admin' ? 'admin' : 'staff' }
  } catch {
    return null
  }
}

export function parseCookies(header) {
  const out = {}
  String(header ?? '')
    .split(';')
    .forEach((part) => {
      const index = part.indexOf('=')
      if (index < 0) return
      const key = part.slice(0, index).trim()
      if (key) out[key] = decodeURIComponent(part.slice(index + 1).trim())
    })
  return out
}

export function setSessionCookie(res, token, { isProduction }) {
  const attrs = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ]
  if (isProduction) attrs.push('Secure')
  res.setHeader('Set-Cookie', attrs.join('; '))
}

export function clearSessionCookie(res, { isProduction }) {
  const attrs = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]
  if (isProduction) attrs.push('Secure')
  res.setHeader('Set-Cookie', attrs.join('; '))
}

export function getSession(req, secret) {
  const cookies = parseCookies(req.headers.cookie)
  return readSessionToken(cookies[SESSION_COOKIE], secret)
}

/* ---------------------------- rate limiting ---------------------------- */

/** In-memory per-key attempt counter. Resets on restart, which is acceptable. */
export function createRateLimiter({
  max = MAX_ATTEMPTS,
  windowMs = ATTEMPT_WINDOW_MS,
} = {}) {
  const hits = new Map()

  function prune(now) {
    hits.forEach((entry, key) => {
      if (entry.resetAt <= now) hits.delete(key)
    })
  }

  return {
    check(key) {
      const now = Date.now()
      prune(now)
      const entry = hits.get(key)
      if (!entry) return { allowed: true, retryAfterSec: 0 }
      if (entry.count < max) return { allowed: true, retryAfterSec: 0 }
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      }
    },
    fail(key) {
      const now = Date.now()
      const entry = hits.get(key)
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs })
        return
      }
      entry.count += 1
    },
    succeed(key) {
      hits.delete(key)
    },
  }
}

export { SESSION_COOKIE }
