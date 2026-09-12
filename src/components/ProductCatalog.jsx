import { useMemo, useState } from 'react'
import {
  PRODUCT_CATEGORY_GROUPS,
  PRODUCT_CATEGORY_TABS,
} from '../data/constants.js'
import {
  categoryLabel,
  getProductToneKeys,
  isProductCategoryVisible,
  productMatchesQuery,
  productMatchesTone,
  toneBadgeVariant,
  toneLabel,
} from '../lib/product.js'
import { cn } from '../lib/cn.js'
import { ProductThumb } from './ProductThumb.jsx'
import { Badge, EmptyState, SearchInput } from './Ui.jsx'

function ProductCard({ product }) {
  const toneKeys = getProductToneKeys(product)

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition duration-200 ease-smooth hover:-translate-y-0.5 hover:shadow-lift">
      <ProductThumb product={product} className="w-full" />

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div>
          <p className="font-display text-xs leading-5 text-ink-muted">
            {product.brand || 'Brand'}
          </p>
          <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-5 text-ink">
            {product.productName}
          </h3>
          <p className="mt-1 text-[10px] font-medium text-klar-500">
            {categoryLabel(product)}
          </p>
        </div>

        {/* 두 개까지만 보여 주고 나머지는 개수로 — 카드 높이가 들쭉날쭉해지지 않게. */}
        <div className="flex flex-wrap gap-1">
          {toneKeys.length > 0 ? (
            <>
              {toneKeys.slice(0, 2).map((toneKey) => (
                <Badge
                  key={toneKey}
                  tone={toneBadgeVariant(toneKey)}
                  className="px-2 py-0.5 text-[10px]"
                >
                  {toneLabel(toneKey)}
                </Badge>
              ))}
              {toneKeys.length > 2 ? (
                <Badge className="px-2 py-0.5 text-[10px]">+{toneKeys.length - 2}</Badge>
              ) : null}
            </>
          ) : (
            <Badge className="px-2 py-0.5 text-[10px]">전체톤</Badge>
          )}
        </div>

        {product.purchaseLink ? (
          <a
            href={product.purchaseLink}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-auto inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-md bg-klar-600 px-3 text-xs font-semibold text-white shadow-lift transition hover:bg-klar-700"
          >
            구매하기
          </a>
        ) : (
          <span className="mt-auto inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-md border border-line bg-surface-sunken px-3 text-xs font-semibold text-ink-faint">
            링크 준비중
          </span>
        )}
      </div>
    </article>
  )
}

function Chip({ active, onClick, children, size = 'md' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full border font-semibold transition duration-200 ease-smooth',
        size === 'md' ? 'px-4 py-2 text-[13px]' : 'px-3 py-1.5 text-[11px]',
        active
          ? 'border-klar-700 bg-klar-700 text-white shadow-lift'
          : 'border-line-strong bg-white text-ink-soft hover:border-klar-400 hover:text-klar-700',
      )}
    >
      {children}
    </button>
  )
}

export function ProductCatalog({
  products,
  categoryVisibility,
  toneKey,
  toneKeys,
  respectVisibility = true,
  searchable = false,
  emptyMessage = '조건에 맞는 제품이 아직 없습니다.',
}) {
  const [activeGroupKey, setActiveGroupKey] = useState('all')
  const [activeDetailKey, setActiveDetailKey] = useState('')
  const [query, setQuery] = useState('')

  const visibleGroups = useMemo(() => {
    if (!respectVisibility) return PRODUCT_CATEGORY_GROUPS
    return PRODUCT_CATEGORY_GROUPS.filter(
      (group) =>
        isProductCategoryVisible(categoryVisibility, group.key) &&
        group.details.some((detail) =>
          isProductCategoryVisible(categoryVisibility, group.key, detail.key),
        ),
    )
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
      if (effectiveDetailKey && product.categoryDetail !== effectiveDetailKey) return false
      if (searchable && !productMatchesQuery(product, query)) return false
      return true
    })
  }, [
    categoryVisibility,
    effectiveDetailKey,
    effectiveGroupKey,
    products,
    query,
    respectVisibility,
    searchable,
    toneKey,
    toneKeys,
  ])

  const filtersActive =
    effectiveGroupKey !== 'all' || Boolean(effectiveDetailKey) || Boolean(query.trim())

  function resetFilters() {
    setActiveGroupKey('all')
    setActiveDetailKey('')
    setQuery('')
  }

  return (
    <div className="space-y-4">
      {searchable ? (
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          placeholder="브랜드 · 제품명 · 톤 검색"
          aria-label="제품 검색"
        />
      ) : null}

      <div className="rail">
        {[PRODUCT_CATEGORY_TABS[0], ...visibleGroups].map((group) => (
          <Chip
            key={group.key}
            active={effectiveGroupKey === group.key}
            onClick={() => {
              setActiveGroupKey(group.key)
              setActiveDetailKey('')
            }}
          >
            {group.label}
          </Chip>
        ))}
      </div>

      {activeGroup?.key !== 'all' ? (
        <div className="rail">
          <Chip size="sm" active={!effectiveDetailKey} onClick={() => setActiveDetailKey('')}>
            전체
          </Chip>
          {visibleDetails.map((detail) => (
            <Chip
              key={detail.key}
              size="sm"
              active={effectiveDetailKey === detail.key}
              onClick={() => setActiveDetailKey(detail.key)}
            >
              {detail.label}
            </Chip>
          ))}
        </div>
      ) : null}

      <p className="text-[13px] text-ink-muted" role="status">
        {filteredProducts.length}개 제품
      </p>

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={filtersActive ? 'search' : 'lipstick'}
          title={filtersActive ? '조건에 맞는 제품이 없습니다' : emptyMessage}
          description={
            filtersActive ? '필터를 넓히거나 검색어를 지워 보세요.' : undefined
          }
          action={
            filtersActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-md border border-line-strong bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-klar-400"
              >
                필터 초기화
              </button>
            ) : null
          }
        />
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
