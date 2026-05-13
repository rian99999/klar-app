import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PERSONAL_TYPES,
  PRODUCT_CATEGORY_GROUPS,
  PRODUCT_CATEGORY_TAB_MAP,
  PRODUCT_TONE_BADGE_LABELS,
  productCategoryVisibilityKey,
} from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { Button, Card, Field, Input, PageHeader, Select } from '../components/Ui.jsx'
import { cn } from '../lib/cn.js'
import { formatDateKo } from '../lib/format.js'

const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'klar-admin'

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
  const fallbackGroup = firstProductGroup()
  const group = PRODUCT_CATEGORY_TAB_MAP[product.categoryGroup] ?? fallbackGroup
  const toneKeys = Array.isArray(product.toneKeys)
    ? product.toneKeys
    : product.toneKey
      ? [product.toneKey]
      : []

  return {
    id: product.id,
    brand: product.brand ?? '',
    productName: product.productName ?? '',
    imageUrl: product.imageUrl ?? '',
    categoryGroup: group.key,
    categoryDetail: product.categoryDetail || group.details[0]?.key || '',
    toneKeys,
    purchaseLink: product.purchaseLink ?? '',
  }
}

function categoryLabel(product) {
  const group = PRODUCT_CATEGORY_TAB_MAP[product.categoryGroup]
  const detail = group?.details.find((item) => item.key === product.categoryDetail)
  return [group?.label, detail?.label].filter(Boolean).join(' · ') || '미분류'
}

function AdminGate({ children }) {
  const [authorized, setAuthorized] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false
    return sessionStorage.getItem('klar-admin-authorized') === 'true'
  })
  const [passcode, setPasscode] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (passcode !== ADMIN_PASSCODE) {
      alert('관리자 코드가 올바르지 않습니다.')
      return
    }
    sessionStorage.setItem('klar-admin-authorized', 'true')
    setAuthorized(true)
  }

  if (authorized) return children

  return (
    <div className="space-y-6">
      <PageHeader
        title="관리자 확인"
        subtitle="/admin은 제품 등록과 카테고리 노출을 관리하는 별도 페이지입니다."
      />
      <Card className="space-y-4">
        <p className="text-sm leading-6 text-klar-600">
          현재 앱은 로컬 저장소 기반이라 서버 인증은 없고, 관리자 코드를 통한
          클라이언트 접근 확인만 적용했습니다.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="관리자 코드">
            <Input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="관리자 코드 입력"
              autoComplete="current-password"
            />
          </Field>
          <Button type="submit" className="w-full">
            관리자 페이지 입장
          </Button>
        </form>
      </Card>
    </div>
  )
}

function ProductForm({ draft, setDraft, onSubmit, onReset }) {
  const selectedGroup = PRODUCT_CATEGORY_TAB_MAP[draft.categoryGroup] ?? firstProductGroup()

  function toggleTone(toneKey) {
    setDraft((current) => {
      const exists = current.toneKeys.includes(toneKey)
      return {
        ...current,
        toneKeys: exists
          ? current.toneKeys.filter((key) => key !== toneKey)
          : [...current.toneKeys, toneKey],
      }
    })
  }

  return (
    <Card className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="brand-kicker">Product Admin</p>
          <h2 className="brand-title mt-1 text-xl">
            {draft.id ? '제품 수정' : '제품 등록'}
          </h2>
        </div>
        {draft.id ? (
          <Button type="button" variant="ghost" className="px-3 py-2 text-[11px]" onClick={onReset}>
            새 등록
          </Button>
        ) : null}
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="브랜드명">
          <Input
            required
            value={draft.brand}
            onChange={(e) => setDraft((current) => ({ ...current, brand: e.target.value }))}
            placeholder="예: KLAR Beauty"
          />
        </Field>
        <Field label="제품명">
          <Input
            required
            value={draft.productName}
            onChange={(e) =>
              setDraft((current) => ({ ...current, productName: e.target.value }))
            }
            placeholder="예: Tone Fit Lip Tint"
          />
        </Field>
        <Field label="이미지 URL">
          <Input
            type="url"
            inputMode="url"
            value={draft.imageUrl}
            onChange={(e) => setDraft((current) => ({ ...current, imageUrl: e.target.value }))}
            placeholder="https://"
          />
        </Field>
        {draft.imageUrl ? (
          <figure className="overflow-hidden rounded-[12px] border border-klar-100 bg-klar-50">
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
                setDraft((current) => ({
                  ...current,
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
              onChange={(e) =>
                setDraft((current) => ({ ...current, categoryDetail: e.target.value }))
              }
            >
              {selectedGroup.details.map((detail) => (
                <option key={detail.key} value={detail.key}>
                  {detail.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="퍼스널컬러 톤">
          <div className="grid grid-cols-2 gap-2">
            {PERSONAL_TYPES.map((tone) => {
              const checked = draft.toneKeys.includes(tone.key)
              return (
                <label
                  key={tone.key}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-[11px] font-semibold transition',
                    checked
                      ? 'border-klar-500 bg-klar-50 text-klar-900'
                      : 'border-klar-100 bg-white text-klar-500',
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-klar-500"
                    checked={checked}
                    onChange={() => toggleTone(tone.key)}
                  />
                  {PRODUCT_TONE_BADGE_LABELS[tone.key] ?? tone.label}
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
            onChange={(e) =>
              setDraft((current) => ({ ...current, purchaseLink: e.target.value }))
            }
            placeholder="https://"
          />
        </Field>

        <Button type="submit" className="w-full shadow-lg shadow-klar-900/10">
          {draft.id ? '수정 내용 저장' : '제품 등록'}
        </Button>
      </form>
    </Card>
  )
}

function VisibilityManager({ visibility, actions }) {
  const allVisible = PRODUCT_CATEGORY_GROUPS.every((group) => {
    const groupVisible = visibility?.[productCategoryVisibilityKey(group.key)] !== false
    return (
      groupVisible &&
      group.details.every(
        (detail) =>
          visibility?.[productCategoryVisibilityKey(group.key, detail.key)] !== false,
      )
    )
  })

  return (
    <Card className="space-y-4">
      <header>
        <p className="brand-kicker">Category Display</p>
        <h2 className="brand-title mt-1 text-xl">카테고리 노출 관리</h2>
      </header>
      <label className="flex items-center justify-between gap-3 rounded-[12px] border border-klar-100 bg-klar-50 px-3 py-3 text-sm font-semibold text-klar-900">
        <span>전체 카테고리 노출</span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-klar-500"
          checked={allVisible}
          onChange={(e) => actions.setAllProductCategoryVisibility(e.target.checked)}
        />
      </label>

      <div className="space-y-3">
        {PRODUCT_CATEGORY_GROUPS.map((group) => {
          const groupKey = productCategoryVisibilityKey(group.key)
          const groupChecked = visibility?.[groupKey] !== false
          return (
            <div key={group.key} className="rounded-[12px] border border-klar-100 bg-white p-3">
              <label className="flex items-center justify-between gap-3 text-sm font-semibold text-klar-900">
                <span>{group.label} 전체선택</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-klar-500"
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
                        'flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[11px] font-semibold',
                        checked
                          ? 'border-klar-100 bg-klar-50 text-klar-800'
                          : 'border-slate-100 bg-slate-50 text-slate-400',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-klar-500"
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
  const [draft, setDraft] = useState(createEmptyDraft)

  const products = useMemo(
    () =>
      state.toneRecommendProducts
        .slice()
        .sort((a, b) =>
          String(b.updatedAt ?? b.createdAt).localeCompare(String(a.updatedAt ?? a.createdAt)),
        ),
    [state.toneRecommendProducts],
  )

  function resetDraft() {
    setDraft(createEmptyDraft())
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (draft.toneKeys.length === 0) {
      alert('퍼스널컬러 톤을 하나 이상 선택해 주세요.')
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
    resetDraft()
  }

  return (
    <AdminGate>
      <div className="space-y-8 pb-24">
        <PageHeader
          title="관리자 페이지"
          subtitle="제품 등록과 결과 페이지 카테고리 노출을 관리합니다."
          right={
            <Link to="/makeup">
              <Button variant="secondary" className="px-3 py-2 text-[11px]">
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
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="brand-kicker">Products</p>
              <h2 className="brand-title text-xl">등록 제품 {products.length}개</h2>
            </div>
          </div>
          {products.length === 0 ? (
            <Card className="border-dashed py-10 text-center text-sm text-klar-500">
              등록된 제품이 없습니다.
            </Card>
          ) : (
            <ul className="space-y-3">
              {products.map((product) => (
                <li key={product.id}>
                  <Card className="p-0">
                    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 p-3">
                      <figure className="aspect-square overflow-hidden rounded-[12px] bg-klar-50">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center font-display text-klar-300">
                            KLAR
                          </div>
                        )}
                      </figure>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-klar-500">
                          {categoryLabel(product)}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-klar-900">
                          {product.productName}
                        </p>
                        <p className="font-display text-xs text-slate-500">{product.brand}</p>
                        <p className="mt-2 text-[10px] text-slate-400">
                          수정 {formatDateKo(product.updatedAt ?? product.createdAt)}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex-1 py-2 text-[11px]"
                            onClick={() => {
                              setDraft(draftFromProduct(product))
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            수정
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            className="flex-1 py-2 text-[11px]"
                            onClick={() => {
                              if (window.confirm('이 제품을 삭제할까요?')) {
                                actions.deleteToneRecommendProduct(product.id)
                              }
                            }}
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
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
