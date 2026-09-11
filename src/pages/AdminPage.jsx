import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PERSONAL_TYPES,
  PRODUCT_CATEGORY_GROUPS,
  PRODUCT_CATEGORY_TAB_MAP,
  productCategoryVisibilityKey,
} from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import {
  categoryLabel,
  getProductToneKeys,
  productMatchesQuery,
  toneBadgeVariant,
  toneLabel,
} from '../lib/product.js'
import { formatDateKo } from '../lib/format.js'
import { cn } from '../lib/cn.js'
import { Icon } from '../components/Icon.jsx'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  SearchInput,
  SectionHeader,
  Select,
} from '../components/Ui.jsx'

function firstProductGroup() {
  return PRODUCT_CATEGORY_GROUPS[0]
}

function createEmptyDraft() {
  const group = firstProductGroup()
  return {
    id: '',
    brand: '',
    productName: '',
    imageUrl: '',
    categoryGroup: group.key,
    categoryDetail: group.details[0]?.key ?? '',
    toneKeys: [],
    purchaseLink: '',
  }
}

function draftFromProduct(product) {
  const group = PRODUCT_CATEGORY_TAB_MAP[product.categoryGroup] ?? firstProductGroup()
  return {
    id: product.id,
    brand: product.brand ?? '',
    productName: product.productName ?? '',
    imageUrl: product.imageUrl ?? '',
    categoryGroup: group.key,
    categoryDetail: product.categoryDetail || group.details[0]?.key || '',
    toneKeys: getProductToneKeys(product),
    purchaseLink: product.purchaseLink ?? '',
  }
}

/**
 * Admin access is decided by the server-issued session role. The old
 * VITE_ADMIN_PASSCODE check ran entirely in the browser with the code baked
 * into the bundle, so it kept nobody out.
 */
function AdminGate({ children }) {
  const { role } = useAuth()
  if (role === 'admin') return children

  return (
    <div>
      <PageHeader
        kicker="Admin"
        title="관리자 전용"
        subtitle="제품 등록과 카테고리 노출은 관리자 계정에서만 변경할 수 있습니다."
        back="/makeup"
      />
      <Card className="space-y-4">
        <p className="flex items-start gap-2 rounded-md bg-klar-50 px-3.5 py-3 text-sm leading-6 text-ink-soft">
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-klar-500" />
          현재 계정은 일반 스태프 권한입니다. 관리자 비밀번호로 다시 접속하면 이 페이지를
          사용할 수 있습니다.
        </p>
        <Link to="/makeup">
          <Button variant="secondary" className="w-full">
            제품 목록으로
          </Button>
        </Link>
      </Card>
    </div>
  )
}

function ProductForm({ draft, setDraft, onSubmit, onReset }) {
  const selectedGroup = PRODUCT_CATEGORY_TAB_MAP[draft.categoryGroup] ?? firstProductGroup()

  function toggleTone(toneKey) {
    setDraft((current) => ({
      ...current,
      toneKeys: current.toneKeys.includes(toneKey)
        ? current.toneKeys.filter((key) => key !== toneKey)
        : [...current.toneKeys, toneKey],
    }))
  }

  return (
    <Card className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="brand-kicker">Product Admin</p>
          <h2 className="brand-title mt-1 text-lg">
            {draft.id ? '제품 수정' : '제품 등록'}
          </h2>
        </div>
        {draft.id ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            새 등록
          </Button>
        ) : null}
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="브랜드명">
            <Input
              required
              value={draft.brand}
              onChange={(e) => setDraft((c) => ({ ...c, brand: e.target.value }))}
              placeholder="KLAR Beauty"
            />
          </Field>
          <Field label="제품명">
            <Input
              required
              value={draft.productName}
              onChange={(e) => setDraft((c) => ({ ...c, productName: e.target.value }))}
              placeholder="Tone Fit Lip Tint"
            />
          </Field>
        </div>

        <Field label="이미지 URL" hint="비워 두면 KLAR 기본 썸네일이 표시됩니다.">
          <Input
            type="url"
            inputMode="url"
            value={draft.imageUrl}
            onChange={(e) => setDraft((c) => ({ ...c, imageUrl: e.target.value }))}
            placeholder="https://"
          />
        </Field>
        {draft.imageUrl ? (
          <figure className="overflow-hidden rounded-md border border-line bg-klar-50">
            <img
              src={draft.imageUrl}
              alt="제품 이미지 미리보기"
              className="aspect-square w-full object-cover"
            />
          </figure>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="대분류">
            <Select
              value={draft.categoryGroup}
              onChange={(e) => {
                const group = PRODUCT_CATEGORY_TAB_MAP[e.target.value]
                setDraft((c) => ({
                  ...c,
                  categoryGroup: group.key,
                  categoryDetail: group.details[0]?.key ?? '',
                }))
              }}
            >
              {PRODUCT_CATEGORY_GROUPS.map((group) => (
                <option key={group.key} value={group.key}>
                  {group.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="세부 카테고리">
            <Select
              value={draft.categoryDetail}
              onChange={(e) => setDraft((c) => ({ ...c, categoryDetail: e.target.value }))}
            >
              {selectedGroup.details.map((detail) => (
                <option key={detail.key} value={detail.key}>
                  {detail.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="퍼스널컬러 톤"
          hint={`선택한 톤의 결과지에 노출됩니다. (${draft.toneKeys.length}개 선택)`}
        >
          <div className="grid grid-cols-2 gap-2">
            {PERSONAL_TYPES.map((tone) => {
              const checked = draft.toneKeys.includes(tone.key)
              return (
                <label
                  key={tone.key}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-[12px] font-semibold transition',
                    checked
                      ? 'border-klar-600 bg-klar-50 text-ink'
                      : 'border-line-strong bg-white text-ink-muted hover:border-klar-400',
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-klar-600"
                    checked={checked}
                    onChange={() => toggleTone(tone.key)}
                  />
                  {toneLabel(tone.key)}
                </label>
              )
            })}
          </div>
        </Field>

        <Field label="구매 링크 URL">
          <Input
            required
            type="url"
            inputMode="url"
            value={draft.purchaseLink}
            onChange={(e) => setDraft((c) => ({ ...c, purchaseLink: e.target.value }))}
            placeholder="https://"
          />
        </Field>

        <Button type="submit" className="w-full" size="lg">
          {draft.id ? '수정 내용 저장' : '제품 등록'}
        </Button>
      </form>
    </Card>
  )
}

function VisibilityManager({ visibility, actions }) {
  const allVisible = PRODUCT_CATEGORY_GROUPS.every(
    (group) =>
      visibility?.[productCategoryVisibilityKey(group.key)] !== false &&
      group.details.every(
        (detail) =>
          visibility?.[productCategoryVisibilityKey(group.key, detail.key)] !== false,
      ),
  )

  return (
    <Card className="space-y-4">
      <header>
        <p className="brand-kicker">Category Display</p>
        <h2 className="brand-title mt-1 text-lg">카테고리 노출 관리</h2>
        <p className="mt-1.5 text-xs leading-5 text-ink-muted">
          꺼진 카테고리는 고객 결과지와 제품 목록의 필터에서 숨겨집니다.
        </p>
      </header>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-klar-200 bg-klar-50 px-3.5 py-3 text-sm font-semibold text-ink">
        <span>전체 카테고리 노출</span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-klar-600"
          checked={allVisible}
          onChange={(e) => actions.setAllProductCategoryVisibility(e.target.checked)}
        />
      </label>

      <div className="space-y-3">
        {PRODUCT_CATEGORY_GROUPS.map((group) => {
          const groupChecked =
            visibility?.[productCategoryVisibilityKey(group.key)] !== false
          return (
            <div key={group.key} className="rounded-md border border-line bg-white p-3.5">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-ink">
                <span>{group.label} 전체선택</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-klar-600"
                  checked={groupChecked}
                  onChange={(e) =>
                    actions.setProductCategoryGroupVisibility(group.key, e.target.checked)
                  }
                />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {group.details.map((detail) => {
                  const key = productCategoryVisibilityKey(group.key, detail.key)
                  const checked = groupChecked && visibility?.[key] !== false
                  return (
                    <label
                      key={detail.key}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[12px] font-semibold transition',
                        checked
                          ? 'border-klar-200 bg-klar-50 text-ink-soft'
                          : 'border-line bg-surface-sunken text-ink-faint',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-klar-600"
                        checked={checked}
                        onChange={(e) =>
                          actions.setProductCategoryVisibility(key, e.target.checked)
                        }
                      />
                      {detail.label}
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function AdminPage() {
  const { state, actions } = useAppData()
  const { toast } = useToast()
  const [draft, setDraft] = useState(createEmptyDraft)
  const [query, setQuery] = useState('')

  const products = useMemo(
    () =>
      state.toneRecommendProducts
        .slice()
        .sort((a, b) =>
          String(b.updatedAt ?? b.createdAt).localeCompare(
            String(a.updatedAt ?? a.createdAt),
          ),
        ),
    [state.toneRecommendProducts],
  )

  const visible = useMemo(
    () => products.filter((product) => productMatchesQuery(product, query)),
    [products, query],
  )

  function resetDraft() {
    setDraft(createEmptyDraft())
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (draft.toneKeys.length === 0) {
      toast('퍼스널컬러 톤을 하나 이상 선택해 주세요.', { tone: 'error' })
      return
    }
    actions.upsertToneRecommendProduct({
      id: draft.id || undefined,
      brand: draft.brand.trim(),
      productName: draft.productName.trim(),
      imageUrl: draft.imageUrl.trim(),
      categoryGroup: draft.categoryGroup,
      categoryDetail: draft.categoryDetail,
      toneKeys: draft.toneKeys,
      purchaseLink: draft.purchaseLink.trim(),
    })
    toast(draft.id ? '제품을 수정했습니다.' : '제품을 등록했습니다.')
    resetDraft()
  }

  return (
    <AdminGate>
      <div className="space-y-7">
        <PageHeader
          kicker="Admin"
          title="관리자 페이지"
          subtitle="제품 등록과 결과 페이지 카테고리 노출을 관리합니다."
          right={
            <Link to="/makeup">
              <Button variant="secondary" size="sm">
                제품 목록
              </Button>
            </Link>
          }
        />

        <ProductForm
          draft={draft}
          setDraft={setDraft}
          onSubmit={handleSubmit}
          onReset={resetDraft}
        />

        <VisibilityManager
          visibility={state.productCategoryVisibility}
          actions={actions}
        />

        <section>
          <SectionHeader kicker="Products" title="등록 제품" count={products.length} />

          {products.length > 0 ? (
            <div className="mb-3">
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery('')}
                placeholder="브랜드 · 제품명 · 톤 검색"
                aria-label="등록 제품 검색"
              />
            </div>
          ) : null}

          {visible.length === 0 ? (
            <EmptyState
              icon={query ? 'search' : 'lipstick'}
              title={query ? '검색 결과가 없습니다' : '등록된 제품이 없습니다'}
              description={
                query
                  ? '다른 검색어로 시도해 보세요.'
                  : '위 폼에서 첫 제품을 등록하면 고객 결과지에 자동으로 연결됩니다.'
              }
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {visible.map((product) => (
                <li key={product.id}>
                  <Card className="p-3">
                    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
                      <figure className="aspect-square overflow-hidden rounded-md bg-klar-50">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center font-display text-sm text-klar-300">
                            KLAR
                          </div>
                        )}
                      </figure>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-klar-500">
                          {categoryLabel(product)}
                        </p>
                        <p className="mt-1 truncate text-[14px] font-semibold text-ink">
                          {product.productName}
                        </p>
                        <p className="font-display text-xs text-ink-muted">
                          {product.brand}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {getProductToneKeys(product)
                            .slice(0, 3)
                            .map((toneKey) => (
                              <Badge
                                key={toneKey}
                                tone={toneBadgeVariant(toneKey)}
                                className="px-2 py-0.5 text-[10px]"
                              >
                                {toneLabel(toneKey)}
                              </Badge>
                            ))}
                          {getProductToneKeys(product).length > 3 ? (
                            <Badge className="px-2 py-0.5 text-[10px]">
                              +{getProductToneKeys(product).length - 3}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-2 text-[10px] text-ink-faint">
                          수정 {formatDateKo(product.updatedAt ?? product.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setDraft(draftFromProduct(product))
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        variant="dangerQuiet"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (window.confirm('이 제품을 삭제할까요?')) {
                            actions.deleteToneRecommendProduct(product.id)
                            toast('제품을 삭제했습니다.', { tone: 'info' })
                          }
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminGate>
  )
}
