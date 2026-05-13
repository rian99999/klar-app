import { useMemo, useState } from 'react'
import {
  PERSONAL_TYPE_MAP,
  PRODUCT_CATEGORY_GROUPS,
  PRODUCT_CATEGORY_TABS,
  PRODUCT_CATEGORY_TAB_MAP,
  PRODUCT_TONE_BADGE_LABELS,
  productCategoryVisibilityKey,
} from '../data/constants.js'
import { cn } from '../lib/cn.js'
import { Card } from './Ui.jsx'

function getProductToneKeys(product) {
  if (Array.isArray(product.toneKeys) && product.toneKeys.length > 0) {
    return product.toneKeys
  }
  return product.toneKey ? [product.toneKey] : []
}

function productMatchesTone(product, toneKeys) {
  if (!toneKeys.length) return true
  const productToneKeys = getProductToneKeys(product)
  return toneKeys.some((toneKey) => productToneKeys.includes(toneKey))
}

function isProductCategoryVisible(visibility, groupKey, detailKey) {
  if (!groupKey) return true
  const groupVisible = visibility?.[productCategoryVisibilityKey(groupKey)]
  const detailVisible = detailKey
    ? visibility?.[productCategoryVisibilityKey(groupKey, detailKey)]
    : true
  return groupVisible !== false && detailVisible !== false
}

function toneBadgeClass(toneKey) {
  if (toneKey.includes('cool') || toneKey.includes('summer') || toneKey.includes('winter')) {
    return 'border-sky-200 bg-sky-50 text-klar-800'
  }
  if (toneKey.includes('warm') || toneKey.includes('spring') || toneKey.includes('autumn')) {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function categoryLabel(product) {
  const group = PRODUCT_CATEGORY_TAB_MAP[product.categoryGroup]
  const detail = group?.details.find((item) => item.key === product.categoryDetail)
  return [group?.label, detail?.label].filter(Boolean).join(' · ') || '미분류'
}

function ProductCard({ product }) {
  const toneKeys = getProductToneKeys(product)

  return (
    <Card className="overflow-hidden rounded-[12px] border-klar-100 bg-white p-0 shadow-card">
      <figure className="aspect-square w-full overflow-hidden bg-klar-50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productName}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-klar-100 to-pearl-100 px-4 text-center font-display text-sm text-klar-400">
            KLAR
          </div>
        )}
      </figure>
      <div className="space-y-2.5 p-3">
        <div>
          <p className="font-display text-[12px] leading-5 text-slate-500">
            {product.brand || 'Brand'}
          </p>
          <p className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-klar-900">
            {product.productName}
          </p>
          <p className="mt-1 text-[10px] font-medium text-klar-500">
            {categoryLabel(product)}
          </p>
        </div>
        <div className="flex min-h-[1.625rem] flex-wrap gap-1.5">
          {toneKeys.length > 0 ? (
            toneKeys.map((toneKey) => (
              <span
                key={toneKey}
                className={cn(
                  'inline-flex rounded-[4px] border px-1.5 py-1 text-[10px] font-semibold leading-none',
                  toneBadgeClass(toneKey),
                )}
              >
                {PRODUCT_TONE_BADGE_LABELS[toneKey] ??
                  PERSONAL_TYPE_MAP[toneKey]?.label ??
                  toneKey}
              </span>
            ))
          ) : (
            <span className="inline-flex rounded-[4px] border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] font-semibold leading-none text-slate-500">
              전체톤
            </span>
          )}
        </div>
        {product.purchaseLink ? (
          <a
            href={product.purchaseLink}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex w-full items-center justify-center rounded-[10px] bg-klar-500 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-lift transition hover:bg-klar-600"
          >
            구매하기
          </a>
        ) : (
          <span className="inline-flex w-full items-center justify-center rounded-[10px] border border-klar-100 bg-klar-50 px-3 py-2.5 text-[11px] font-semibold text-klar-400">
            링크 준비중
          </span>
        )}
      </div>
    </Card>
  )
}

export function ProductCatalog({
  products,
  categoryVisibility,
  toneKey,
  toneKeys,
  respectVisibility = true,
  emptyMessage = '조건에 맞는 제품이 아직 없습니다.',
}) {
  const [activeGroupKey, setActiveGroupKey] = useState('all')
  const [activeDetailKey, setActiveDetailKey] = useState('')

  const visibleGroups = useMemo(() => {
    if (!respectVisibility) return PRODUCT_CATEGORY_GROUPS
    return PRODUCT_CATEGORY_GROUPS.filter((group) => {
      if (!isProductCategoryVisible(categoryVisibility, group.key)) return false
      return group.details.some((detail) =>
        isProductCategoryVisible(categoryVisibility, group.key, detail.key),
      )
    })
  }, [categoryVisibility, respectVisibility])

  const effectiveGroupKey =
    activeGroupKey === 'all' || visibleGroups.some((group) => group.key === activeGroupKey)
      ? activeGroupKey
      : 'all'

  const activeGroup =
    effectiveGroupKey === 'all'
      ? PRODUCT_CATEGORY_TABS[0]
      : visibleGroups.find((group) => group.key === effectiveGroupKey)

  const visibleDetails = useMemo(() => {
    if (!activeGroup || activeGroup.key === 'all') return []
    return activeGroup.details.filter((detail) =>
      respectVisibility
        ? isProductCategoryVisible(categoryVisibility, activeGroup.key, detail.key)
        : true,
    )
  }, [activeGroup, categoryVisibility, respectVisibility])

  const effectiveDetailKey =
    activeDetailKey && visibleDetails.some((detail) => detail.key === activeDetailKey)
      ? activeDetailKey
      : ''

  const filteredProducts = useMemo(() => {
    const activeToneKeys = Array.isArray(toneKeys)
      ? toneKeys.filter(Boolean)
      : toneKey
        ? [toneKey]
        : []
    return products.filter((product) => {
      if (!productMatchesTone(product, activeToneKeys)) return false
      if (
        respectVisibility &&
        !isProductCategoryVisible(
          categoryVisibility,
          product.categoryGroup,
          product.categoryDetail,
        )
      ) {
        return false
      }
      if (effectiveGroupKey !== 'all' && product.categoryGroup !== effectiveGroupKey) {
        return false
      }
      if (effectiveDetailKey && product.categoryDetail !== effectiveDetailKey) {
        return false
      }
      return true
    })
  }, [
    categoryVisibility,
    effectiveDetailKey,
    effectiveGroupKey,
    products,
    respectVisibility,
    toneKey,
    toneKeys,
  ])

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex min-w-max gap-2">
          {[PRODUCT_CATEGORY_TABS[0], ...visibleGroups].map((group) => {
            const active = effectiveGroupKey === group.key
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => {
                  setActiveGroupKey(group.key)
                  setActiveDetailKey('')
                }}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-semibold transition',
                  active
                    ? 'border-klar-900 bg-klar-900 text-white'
                    : 'border-klar-200 bg-white/85 text-klar-700 hover:border-klar-400',
                )}
              >
                {group.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeGroup?.key !== 'all' ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex min-w-max gap-2">
            <button
              type="button"
              onClick={() => setActiveDetailKey('')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition',
                !effectiveDetailKey
                  ? 'border-klar-500 bg-klar-500 text-white'
                  : 'border-klar-100 bg-white text-klar-600',
              )}
            >
              전체
            </button>
            {visibleDetails.map((detail) => {
              const active = effectiveDetailKey === detail.key
              return (
                <button
                  key={detail.key}
                  type="button"
                  onClick={() => setActiveDetailKey(detail.key)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition',
                    active
                      ? 'border-klar-500 bg-klar-500 text-white'
                      : 'border-klar-100 bg-white text-klar-600',
                  )}
                >
                  {detail.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {filteredProducts.length === 0 ? (
        <Card className="border-dashed bg-white/70 py-10 text-center text-sm text-klar-500">
          {emptyMessage}
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
