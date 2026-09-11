import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * Reads a product page and pulls out the fields the admin form needs.
 *
 * Runs on the server because the browser cannot fetch other origins, and
 * because fetching a user-supplied URL needs SSRF protection the client
 * cannot provide.
 */

const MAX_BYTES = 3 * 1024 * 1024
const TIMEOUT_MS = 12000
const MAX_REDIRECTS = 4

const USER_AGENT =
  'Mozilla/5.0 (compatible; KLAR-ProductImport/1.0; +https://github.com/rian99999/klar-app)'

/* ------------------------------- SSRF guard ------------------------------- */

function isPrivateIPv4(ip) {
  const p = ip.split('.').map(Number)
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true
  const [a, b] = p
  if (a === 10 || a === 127 || a === 0) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true // link-local, incl. cloud metadata
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  if (a >= 224) return true // multicast / reserved
  return false
}

function isPrivateIPv6(ip) {
  const v = ip.toLowerCase()
  if (v === '::1' || v === '::') return true
  if (v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true
  // IPv4-mapped (::ffff:10.0.0.1)
  const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/)
  if (mapped) return isPrivateIPv4(mapped[1])
  return false
}

export function isPrivateAddress(ip) {
  const kind = isIP(ip)
  if (kind === 4) return isPrivateIPv4(ip)
  if (kind === 6) return isPrivateIPv6(ip)
  return true
}

/** Rejects anything that is not a public http(s) address. */
export async function assertSafeUrl(rawUrl, { resolveHost = lookup } = {}) {
  let url
  try {
    url = new URL(String(rawUrl))
  } catch {
    throw Object.assign(new Error('invalid_url'), { code: 'invalid_url' })
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw Object.assign(new Error('unsupported_protocol'), { code: 'unsupported_protocol' })
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) {
    throw Object.assign(new Error('blocked_host'), { code: 'blocked_host' })
  }
  if (isIP(host)) {
    if (isPrivateAddress(host)) {
      throw Object.assign(new Error('blocked_host'), { code: 'blocked_host' })
    }
    return url
  }
  let records
  try {
    records = await resolveHost(host, { all: true })
  } catch {
    throw Object.assign(new Error('dns_failed'), { code: 'dns_failed' })
  }
  const list = Array.isArray(records) ? records : [records]
  if (list.length === 0 || list.some((r) => isPrivateAddress(r.address))) {
    throw Object.assign(new Error('blocked_host'), { code: 'blocked_host' })
  }
  return url
}

/* -------------------------------- parsing -------------------------------- */

function decodeEntities(text) {
  return String(text ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, '&')
    .trim()
}

function metaContent(html, patterns) {
  for (const pattern of patterns) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*["']${pattern}["'][^>]*>`,
      'gi',
    )
    const tags = html.match(re)
    if (!tags) continue
    for (const tag of tags) {
      const value = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1]
      if (value) return decodeEntities(value)
    }
  }
  return ''
}

function metaContentAll(html, pattern) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)\\s*=\\s*["']${pattern}["'][^>]*>`,
    'gi',
  )
  return (html.match(re) ?? [])
    .map((tag) => tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1])
    .filter(Boolean)
    .map(decodeEntities)
}

function absolute(src, baseUrl) {
  try {
    return new URL(decodeEntities(src), baseUrl).toString()
  } catch {
    return null
  }
}

/** Filters out sprites, icons, badges and tracking pixels. */
function looksLikeProductImage(url) {
  const lower = url.toLowerCase()
  if (/\.svg(\?|$)/.test(lower)) return false
  if (/(sprite|icon|logo|favicon|badge|button|blank|pixel|spacer|loading)/.test(lower)) {
    return false
  }
  return /\.(jpe?g|png|webp|gif|avif)(\?|$)/.test(lower) || /(image|img|photo)/.test(lower)
}

function collectJsonLd(html) {
  const blocks =
    html.match(/<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ??
    []
  const out = []
  blocks.forEach((block) => {
    const body = block.replace(/^[\s\S]*?>/, '').replace(/<\/script>$/i, '')
    try {
      out.push(JSON.parse(body))
    } catch {
      // Some sites emit trailing commas or HTML comments; skip those blocks.
    }
  })
  return out
}

function findProductNodes(value, found = []) {
  if (!value || typeof value !== 'object') return found
  if (Array.isArray(value)) {
    value.forEach((item) => findProductNodes(item, found))
    return found
  }
  const type = value['@type']
  const types = Array.isArray(type) ? type : [type]
  if (types.some((t) => String(t).toLowerCase() === 'product')) found.push(value)
  Object.values(value).forEach((child) => findProductNodes(child, found))
  return found
}

function textOf(value) {
  if (!value) return ''
  if (typeof value === 'string') return decodeEntities(value)
  if (typeof value === 'object') return decodeEntities(value.name ?? value['@value'] ?? '')
  return ''
}

function imagesOf(value) {
  if (!value) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(imagesOf)
  if (typeof value === 'object') return imagesOf(value.url ?? value.contentUrl ?? null)
  return []
}

/** Shade / colour / size options, which the studio registers as separate products. */
function variantsOf(product) {
  const names = new Set()
  const push = (v) => {
    const t = textOf(v)
    if (t && t.length <= 60) names.add(t)
  }
  ;[].concat(product.hasVariant ?? []).forEach((variant) => {
    if (typeof variant === 'object') {
      push(variant.name ?? variant.color ?? variant.size)
    } else push(variant)
  })
  ;[].concat(product.color ?? []).forEach(push)
  ;[].concat(product.additionalProperty ?? []).forEach((prop) => {
    if (prop && typeof prop === 'object' && /color|colour|shade|option|색상|호수|옵션/i.test(String(prop.name ?? ''))) {
      ;[].concat(prop.value ?? []).forEach(push)
    }
  })
  return [...names]
}

/** Option values rendered as <select><option> — common on Korean shops. */
function optionsFromSelects(html) {
  const names = new Set()
  const selects = html.match(/<select[\s\S]*?<\/select>/gi) ?? []
  selects.forEach((select) => {
    const options = select.match(/<option[^>]*>([\s\S]*?)<\/option>/gi) ?? []
    options.forEach((option) => {
      const text = decodeEntities(
        option.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '),
      )
      if (!text) return
      if (text.length > 60) return
      if (/선택|choose|select|옵션을|필수|^-+$/i.test(text)) return
      names.add(text)
    })
  })
  return [...names].slice(0, 40)
}

function imagesFromHtml(html, baseUrl) {
  const found = []
  const tags = html.match(/<img[^>]*>/gi) ?? []
  tags.forEach((tag) => {
    const src =
      tag.match(/\bdata-(?:original|src|lazy-src)\s*=\s*["']([^"']+)["']/i)?.[1] ??
      tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]
    if (!src || src.startsWith('data:')) return
    const url = absolute(src, baseUrl)
    if (url && looksLikeProductImage(url)) found.push(url)
  })
  return found
}

/**
 * Pure parser — takes page HTML, returns the fields the admin form needs.
 * Kept separate from fetching so it can be tested against fixtures.
 */
export function extractProductInfo(html, baseUrl) {
  const products = collectJsonLd(html).flatMap((node) => findProductNodes(node))
  const product = products[0] ?? {}

  const productName =
    textOf(product.name) ||
    metaContent(html, ['og:title', 'twitter:title']) ||
    decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')

  const brand =
    textOf(product.brand) ||
    metaContent(html, ['product:brand', 'og:brand', 'og:site_name', 'twitter:site'])

  const rawImages = [
    ...imagesOf(product.image),
    ...metaContentAll(html, 'og:image'),
    ...metaContentAll(html, 'twitter:image'),
    ...imagesFromHtml(html, baseUrl),
  ]

  const images = []
  const seen = new Set()
  rawImages.forEach((src) => {
    const url = absolute(src, baseUrl)
    if (!url || seen.has(url)) return
    seen.add(url)
    images.push(url)
  })

  const jsonLdVariants = variantsOf(product)
  const variants = (jsonLdVariants.length ? jsonLdVariants : optionsFromSelects(html)).slice(0, 40)

  const offers = [].concat(product.offers ?? [])[0]
  const price = offers && typeof offers === 'object' ? textOf(offers.price ?? '') : ''

  return {
    productName: productName.slice(0, 200),
    brand: brand.slice(0, 100),
    images: images.slice(0, 24),
    variants,
    price,
    description: metaContent(html, ['og:description', 'description']).slice(0, 300),
    siteName: metaContent(html, ['og:site_name']),
    sourceUrl: baseUrl,
  }
}

/* -------------------------------- fetching -------------------------------- */

async function readCapped(response) {
  const reader = response.body?.getReader()
  if (!reader) return await response.text()
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_BYTES) {
      await reader.cancel()
      break
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8')
}

/**
 * Fetches the page and extracts product fields. Redirects are followed
 * manually so every hop is re-checked against the SSRF guard.
 */
export async function fetchProductInfo(rawUrl, { fetchImpl = fetch, resolveHost } = {}) {
  let current = rawUrl
  let response
  let finalUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const safeUrl = await assertSafeUrl(current, resolveHost ? { resolveHost } : {})
    finalUrl = safeUrl.toString()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      response = await fetchImpl(finalUrl, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        },
      })
    } catch (error) {
      throw Object.assign(new Error('fetch_failed'), {
        code: error?.name === 'AbortError' ? 'timeout' : 'fetch_failed',
      })
    } finally {
      clearTimeout(timer)
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) break
      current = new URL(location, finalUrl).toString()
      continue
    }
    break
  }

  if (!response.ok) {
    throw Object.assign(new Error('http_error'), {
      code: 'http_error',
      status: response.status,
    })
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType && !/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
    throw Object.assign(new Error('not_html'), { code: 'not_html' })
  }

  return extractProductInfo(await readCapped(response), finalUrl)
}
