import express from 'express'
import { accessSync, constants, existsSync, readFileSync } from 'node:fs'
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
import { fetchProductInfo } from './scrape.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
/**
 * Loads `KEY=value` lines from a .env file next to package.json, so a password
 * can be set by editing a text file instead of exporting shell variables.
 * Real environment variables always win.
 */
function loadEnvFile(filePath) {
  let raw
  try {
    raw = readFileSync(filePath, 'utf8')
  } catch {
    return
  }
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index <= 0) return
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = value
  })
}

loadEnvFile(path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), '.env'))

/**
 * Hosting platforms start the app with their own command and rarely set
 * NODE_ENV, so a missed flag used to boot the Vite dev server on a container
 * that has no devDependencies. Their own marker variables settle it instead.
 */
const HOSTED_MARKERS = [
  'RAILWAY_ENVIRONMENT',
  'RAILWAY_PROJECT_ID',
  'RENDER',
  'FLY_APP_NAME',
  'KOYEB_APP_NAME',
]

const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.argv.includes('--production') ||
  HOSTED_MARKERS.some((key) => process.env[key])

const port = Number(process.env.PORT || 5173)
const host = process.env.HOST || '0.0.0.0'

/** `/data` is where a hosted volume is normally mounted; use it when it exists. */
function defaultDbPath() {
  if (isProduction) {
    try {
      accessSync('/data', constants.W_OK)
      return '/data/klar-db.json'
    } catch {
      // 볼륨이 없으면 아래 기본 경로를 씁니다 (부팅 시 경고 출력).
    }
  }
  return path.join('server', 'data', 'klar-db.json')
}

const dbPath = path.resolve(rootDir, process.env.KLAR_DB_PATH || defaultDbPath())

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

/** 앱 대신 띄우는 한 화면짜리 안내 페이지. */
function noticePage({ title, heading, body }) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:linear-gradient(180deg,#f2f7fb,#f8f5ef);color:#0d3b6e;
    font-family:"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;padding:24px}
  main{max-width:34rem;background:#fff;border:1px solid #dce9f4;border-radius:16px;
    padding:28px;box-shadow:0 12px 32px -18px rgba(13,59,110,.35)}
  h1{font-size:1.35rem;margin:0 0 12px}
  p{line-height:1.7;color:#436288;margin:0 0 12px}
  ol{line-height:1.9;color:#436288;padding-left:1.2em;margin:0 0 12px}
  code{background:#eaf2f9;border-radius:6px;padding:2px 6px;font-size:.92em}
  .tag{display:inline-block;font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;
    color:#5ba8cd;font-weight:700;margin-bottom:10px}
</style></head><body><main>
<p class="tag">KLAR SETUP</p>
<h1>${heading}</h1>
${body}
</main></body></html>`
}

const SETUP_PAGE = noticePage({
  title: 'KLAR · 설정이 한 가지 남았습니다',
  heading: '비밀번호를 아직 정하지 않았습니다',
  body: `<p>서버는 잘 켜져 있습니다. 고객 정보를 보호하기 위해, 접속 비밀번호가 정해지기
전에는 앱을 열지 않습니다.</p>
<ol>
  <li>배포한 서비스(예: Railway)의 <b>Variables</b> 화면을 엽니다.</li>
  <li><code>KLAR_PASSWORD</code> 를 추가하고 원하는 비밀번호를 넣습니다.</li>
  <li>저장하면 자동으로 다시 시작되고, 이 화면 대신 앱이 열립니다.</li>
</ol>
<p>기록이 지워지지 않게 하려면 볼륨을 <code>/data</code> 에 연결해 주세요. 연결해 두면
저장 위치는 알아서 잡힙니다.</p>`,
})

const BUILD_PAGE = noticePage({
  title: 'KLAR · 화면 파일을 만들지 못했습니다',
  heading: '화면 파일(빌드)이 없습니다',
  body: `<p>서버는 켜져 있지만 보여 줄 화면 파일이 없고, 자동으로 만드는 것도 실패했습니다.</p>
<ol>
  <li>배포 설정의 <b>Build Command</b> 가 <code>npm run build</code> 인지 확인합니다.</li>
  <li>배포 로그 맨 아래의 오류 줄을 확인합니다.</li>
</ol>`,
})

function startMessageServer(page, kind) {
  const app = express()
  app.set('trust proxy', 1)
  // 컨테이너 자체는 살아 있으므로 헬스체크는 통과시킵니다 (배포 실패로 뜨지 않게).
  app.get('/api/health', (req, res) => res.json({ ok: true, setup: kind }))
  app.use((req, res) => {
    res.status(503)
    if (req.accepts('html')) res.type('html').send(page)
    else res.json({ ok: false, error: 'setup_required', setup: kind })
  })
  const reason =
    kind === 'KLAR_PASSWORD'
      ? [
          '  [klar-auth] KLAR_PASSWORD is not set.',
          '',
          '  The app is not served until a password is configured.',
          "  Set KLAR_PASSWORD in your host's environment variables.",
        ]
      : [
          '  [klar] No build to serve and building it failed.',
          '',
          '  Check that the build command is `npm run build`.',
        ]

  app.listen(port, host, () => {
    console.error(
      [
        '',
        '*********************************************************************',
        ...reason,
        '*********************************************************************',
        '',
      ].join('\n'),
    )
    console.log(`KLAR notice page at http://${host}:${port}/`)
  })
}

async function startServer() {
  const app = express()
  app.set('trust proxy', 1)

  const passwords = resolvePasswords({ isProduction })

  // 비밀번호가 없으면 앱을 열어 주지 않되, 무엇을 해야 하는지는 화면에 띄웁니다.
  if (!passwords) {
    startMessageServer(SETUP_PAGE, 'KLAR_PASSWORD')
    return
  }

  const { secret: sessionSecret, ephemeral } = resolveSessionSecret(
    path.dirname(dbPath),
  )
  const loginLimiter = createRateLimiter()
  const portalLimiter = createRateLimiter({ max: 10 })
  // Outbound fetches are costly and easy to abuse, so cap them per staff IP.
  const scrapeLimiter = createRateLimiter({ max: 40, windowMs: 1000 * 60 * 10 })

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

  /** Staff-only: reads a product page so the admin form can be prefilled. */
  app.post('/api/products/scrape', requireStaff, async (req, res) => {
    const key = clientKey(req)
    const limit = scrapeLimiter.check(key)
    if (!limit.allowed) {
      res
        .status(429)
        .json({ ok: false, error: 'too_many_requests', retryAfterSec: limit.retryAfterSec })
      return
    }
    scrapeLimiter.fail(key)

    try {
      res.json({ ok: true, data: await fetchProductInfo(req.body?.url) })
    } catch (error) {
      const code = error?.code ?? 'fetch_failed'
      const status = code === 'invalid_url' || code === 'blocked_host' ? 400 : 502
      res.status(status).json({ ok: false, error: code, status: error?.status })
    }
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

    // 빌드가 없으면 여기서 한 번 만들어 둡니다. 호스팅사가 빌드 단계를 건너뛰었을 때
    // 빈 화면 대신 앱이 뜨게 하기 위해서입니다.
    if (!existsSync(path.join(distDir, 'index.html'))) {
      console.log('[klar] No build found — building the app once…')
      try {
        const { build } = await import('vite')
        await build({ root: rootDir, logLevel: 'warn' })
        console.log('[klar] Build finished.')
      } catch (error) {
        console.error('[klar] Build failed:', error?.message ?? error)
        startMessageServer(BUILD_PAGE, 'build')
        return
      }
    }

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
        '[klar-auth] Could not store a session secret — sessions will end on restart.',
      )
    }
    // 볼륨 없이 컨테이너 안에만 저장하고 있으면 기록이 날아갑니다.
    if (isProduction && !dbPath.startsWith('/data')) {
      console.warn(
        [
          '',
          '*********************************************************************',
          '  [klar-db] No persistent volume detected.',
          '',
          '  Hosted containers get a fresh filesystem on every deploy and',
          '  restart, so customer records saved here WILL BE LOST.',
          '',
          '  Attach a volume mounted at /data — the path is then picked up',
          '  automatically (or set KLAR_DB_PATH yourself).',
          '*********************************************************************',
          '',
        ].join('\n'),
      )
    }
  })
}

startServer().catch((error) => {
  console.error(error)
  process.exit(1)
})
