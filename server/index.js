import express from 'express'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defaultState, normalizeState } from '../src/lib/storage.js'
import {
  isProductCategoryVisible,
  productMatchesTone,
} from '../src/lib/product.js'
import {
  clearSessionCookie,
  createRateLimiter,
  createSessionToken,
  getSession,
  resolvePasswords,
  resolveSessionSecret,
  setSessionCookie,
  verifyPassword,
} from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const isProduction =
  process.env.NODE_ENV === 'production' || process.argv.includes('--production')
const port = Number(process.env.PORT || 5173)
const host = process.env.HOST || '0.0.0.0';
const dbPath = path.resolve(
  rootDir,
  process.env.KLAR_DB_PATH || path.join('server', 'data', 'klar-db.json'),
)

async function readDb() {
  try {
    const raw = await readFile(dbPath, 'utf8')
    return normalizeState(JSON.parse(raw))
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('[klar-db] Failed to read database. Using defaults.', error)
    }
    return defaultState()
  }
}

async function writeDb(state) {
  const nextState = normalizeState(state)
  await mkdir(path.dirname(dbPath), { recursive: true })
  await writeFile(dbPath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8')
  return nextState
}

function digitsOf(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function normalizeName(value) {
  return String(value ?? '').replace(/\s/g, '').toLowerCase()
}

/**
 * Builds the slice of the database one customer is allowed to see: their own
 * records plus the products matching their diagnosed tones. The client used to
 * download the entire database and filter in the browser, which exposed every
 * other customer to anyone holding a result link.
 */
function buildPortalPayload(state, customer) {
  const personalColorSessions = state.personalColorSessions
    .filter((s) => s.customerId === customer.id)
    .sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO)))

  const makeupConsultSessions = state.makeupConsultSessions
    .filter((s) => s.customerId === customer.id)
    .sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO)))

  const toneKeys = [
    ...new Set(
      personalColorSessions.flatMap((s) =>
        [s.primaryTypeKey, s.secondaryTypeKey].filter(Boolean),
      ),
    ),
  ]

  const products = state.toneRecommendProducts.filter(
    (product) =>
      productMatchesTone(product, toneKeys) &&
      isProductCategoryVisible(
        state.productCategoryVisibility,
        product.categoryGroup,
        product.categoryDetail,
      ),
  )

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phoneLast4: digitsOf(customer.phone).slice(-4),
    },
    personalColorSessions,
    makeupConsultSessions,
    toneRecommendProducts: products,
    productCategoryVisibility: state.productCategoryVisibility,
  }
}

async function startServer() {
  const app = express()
  app.set('trust proxy', 1)

  const passwords = resolvePasswords({ isProduction })
  const { secret: sessionSecret, ephemeral } = resolveSessionSecret()
  const loginLimiter = createRateLimiter()
  const portalLimiter = createRateLimiter({ max: 10 })

  const clientKey = (req) => req.ip || req.socket.remoteAddress || 'unknown'

  function requireStaff(req, res, next) {
    const session = getSession(req, sessionSecret)
    if (!session) {
      res.status(401).json({ ok: false, error: 'unauthorized' })
      return
    }
    req.session = session
    next()
  }

  app.use(express.json({ limit: '10mb' }))

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/auth/session', (req, res) => {
    const session = getSession(req, sessionSecret)
    res.json({
      authenticated: Boolean(session),
      role: session?.role ?? null,
      usingDevPassword: passwords.isDefault,
    })
  })

  app.post('/api/auth/login', (req, res) => {
    const key = clientKey(req)
    const limit = loginLimiter.check(key)
    if (!limit.allowed) {
      res
        .status(429)
        .json({ ok: false, error: 'too_many_attempts', retryAfterSec: limit.retryAfterSec })
      return
    }

    const password = req.body?.password
    const isAdmin = verifyPassword(password, passwords.admin)
    const isStaff = isAdmin || verifyPassword(password, passwords.staff)

    if (!isStaff) {
      loginLimiter.fail(key)
      res.status(401).json({ ok: false, error: 'invalid_password' })
      return
    }

    loginLimiter.succeed(key)
    const role = isAdmin ? 'admin' : 'staff'
    setSessionCookie(res, createSessionToken({ role, secret: sessionSecret }), {
      isProduction,
    })
    res.json({ ok: true, role })
  })

  app.post('/api/auth/logout', (req, res) => {
    clearSessionCookie(res, { isProduction })
    res.json({ ok: true })
  })

  /** Public: a customer proves identity, and receives only their own records. */
  app.post('/api/portal/:customerId', async (req, res, next) => {
    try {
      const key = `${clientKey(req)}:${req.params.customerId}`
      const limit = portalLimiter.check(key)
      if (!limit.allowed) {
        res
          .status(429)
          .json({ ok: false, error: 'too_many_attempts', retryAfterSec: limit.retryAfterSec })
        return
      }

      const state = await readDb()
      const customer = state.customers.find((c) => c.id === req.params.customerId)
      const expectedLast4 = digitsOf(customer?.phone).slice(-4)

      const nameMatches =
        Boolean(customer) &&
        normalizeName(req.body?.name) === normalizeName(customer.name)
      const phoneMatches =
        expectedLast4.length === 4 &&
        digitsOf(req.body?.lastDigits).slice(-4) === expectedLast4

      if (!customer || !nameMatches || !phoneMatches) {
        portalLimiter.fail(key)
        // Same response whether the link is wrong or the details are, so the
        // endpoint cannot be used to enumerate customers.
        res.status(401).json({ ok: false, error: 'verification_failed' })
        return
      }

      portalLimiter.succeed(key)
      res.json({ ok: true, data: buildPortalPayload(state, customer) })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/state', requireStaff, async (req, res, next) => {
    try {
      res.json(await readDb())
    } catch (error) {
      next(error)
    }
  })

  app.put('/api/state', requireStaff, async (req, res, next) => {
    try {
      const saved = await writeDb(req.body)
      res.json({ ok: true, state: saved })
    } catch (error) {
      next(error)
    }
  })

  if (isProduction) {
    const distDir = path.join(rootDir, 'dist')
    app.use(express.static(distDir))
    app.use((req, res, next) => {
      if (req.method !== 'GET' || !req.accepts('html')) {
        next()
        return
      }
      res.sendFile(path.join(distDir, 'index.html'))
    })
  } else {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      root: rootDir,
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  app.use((error, req, res, next) => {
    console.error(error)
    if (res.headersSent) {
      next(error)
      return
    }
    res.status(500).json({ ok: false, error: 'Internal server error' })
  })

  await writeDb(await readDb())

  app.listen(port, host, () => {
    console.log(`KLAR server running at http://${host}:${port}/`)
    console.log(`KLAR database file: ${dbPath}`)
    if (passwords.isDefault) {
      console.warn(
        `[klar-auth] KLAR_PASSWORD is not set — using the development password. Set KLAR_PASSWORD before deploying.`,
      )
    }
    if (ephemeral) {
      console.warn(
        '[klar-auth] KLAR_SESSION_SECRET is not set — sessions will end on restart.',
      )
    }
  })
}

startServer().catch((error) => {
  console.error(error)
  process.exit(1)
})
