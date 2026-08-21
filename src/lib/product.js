import {
  PERSONAL_TYPE_MAP,
  PRODUCT_CATEGORY_TAB_MAP,
  PRODUCT_TONE_BADGE_LABELS,
  productCategoryVisibilityKey,
} from '../data/constants.js'

/**
 * Product/tone helpers shared by ProductCatalog, AdminPage and the client
 * portal. These four functions used to exist in two (slightly diverging)
 * copies.
 */

export function getProductToneKeys(product) {
  if (Array.isArray(product?.toneKeys) && product.toneKeys.length > 0) {
    return product.toneKeys
  }
  return product?.toneKey ? [product.toneKey] : []
}

export function productMatchesTone(product, toneKeys) {
  if (!toneKeys.length) return true
  const productToneKeys = getProductToneKeys(product)
  return toneKeys.some((toneKey) => productToneKeys.includes(toneKey))
}

export function isProductCategoryVisible(visibility, groupKey, detailKey) {
  if (!groupKey) return true
  const groupVisible = visibility?.[productCategoryVisibilityKey(groupKey)]
  const detailVisible = detailKey
    ? visibility?.[productCategoryVisibilityKey(groupKey, detailKey)]
    : true
  return groupVisible !== false && detailVisible !== false
}

export function categoryLabel(product) {
  const group = PRODUCT_CATEGORY_TAB_MAP[product?.categoryGroup]
  const detail = group?.details.find((item) => item.key === product?.categoryDetail)
  return [group?.label, detail?.label].filter(Boolean).join(' · ') || '미분류'
}

export function toneLabel(toneKey) {
  return (
    PRODUCT_TONE_BADGE_LABELS[toneKey] ?? PERSONAL_TYPE_MAP[toneKey]?.label ?? toneKey
  )
}

/** Maps a personal-colour key onto the warm/cool badge palette. */
export function toneBadgeVariant(toneKey = '') {
  if (/cool|summer|winter/.test(toneKey)) return 'cool'
  if (/warm|spring|autumn/.test(toneKey)) return 'warm'
  return 'neutral'
}

/** Free-text search across the fields a user would actually type. */
export function productMatchesQuery(product, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true
  return [
    product?.brand,
    product?.productName,
    product?.shade,
    categoryLabel(product),
    ...getProductToneKeys(product).map(toneLabel),
  ]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q))
}
