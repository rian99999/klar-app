import express from 'express'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defaultState, normalizeState } from '../src/lib/storage.js'

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

async function startServer() {
  const app = express()

  app.use(express.json({ limit: '10mb' }))

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/state', async (req, res, next) => {
    try {
      res.json(await readDb())
    } catch (error) {
      next(error)
    }
  })

  app.put('/api/state', async (req, res, next) => {
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
  })
}

startServer().catch((error) => {
  console.error(error)
  process.exit(1)
})
