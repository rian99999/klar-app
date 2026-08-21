import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MAKEUP_DAY_CATEGORIES } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { createId } from '../lib/ids.js'
import { isoDateOnly } from '../lib/format.js'
import { cn } from '../lib/cn.js'
import { Icon } from '../components/Icon.jsx'
import {
  Button,
  Card,
  DateInput,
  Field,
  FORM_BOTTOM_SPACE,
  FormActionBar,
  Input,
  PageHeader,
  SectionHeader,
  Textarea,
} from '../components/Ui.jsx'

function blankLine() {
  return {
    lineId: createId(),
    category: MAKEUP_DAY_CATEGORIES[0],
    brand: '',
    productName: '',
    shade: '',
    memo: '',
  }
}

/** Category is a chip rail here — faster than a select on a phone at the chair. */
function CategoryPicker({ value, onChange, name }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="카테고리">
      {MAKEUP_DAY_CATEGORIES.map((category) => {
        const active = value === category
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={active}
            name={name}
            onClick={() => onChange(category)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-200 ease-smooth',
              active
                ? 'border-klar-600 bg-klar-600 text-white'
                : 'border-line-strong bg-white text-ink-soft hover:border-klar-400',
            )}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}

function ProductLine({ row, index, canRemove, onChange, onRemove }) {
  return (
    <li className="rounded-lg border border-line bg-white p-3.5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-klar-100 text-[11px] font-bold text-klar-700">
            {index + 1}
          </span>
          {row.productName?.trim() || '새 제품'}
        </p>
        <button
          type="button"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label={`${index + 1}번 제품 삭제`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint"
        >
          <Icon name="trash" className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3.5">
        <Field label="카테고리">
          <CategoryPicker
            name={`category-${row.lineId}`}
            value={row.category}
            onChange={(category) => onChange({ category })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="브랜드">
            <Input
              value={row.brand}
              onChange={(e) => onChange({ brand: e.target.value })}
              placeholder="브랜드"
            />
          </Field>
          <Field label="색상 · 호수">
            <Input
              value={row.shade}
              onChange={(e) => onChange({ shade: e.target.value })}
              placeholder="#21 / 로즈"
            />
          </Field>
        </div>
        <Field label="제품명">
          <Input
            value={row.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            placeholder="제품 라인 이름"
          />
        </Field>
        <Field label="메모">
          <Textarea
            className="min-h-[5rem]"
            value={row.memo}
            onChange={(e) => onChange({ memo: e.target.value })}
            placeholder="연출 포인트, 발색 메모 등"
          />
        </Field>
      </div>
    </li>
  )
}

export function MakeupConsultFormPage({ mode }) {
  const isNew = mode === 'new'
  const { customerId, sessionId } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useAppData()
  const { toast } = useToast()

  const customer = state.customers.find((c) => c.id === customerId)
  const existing = !isNew
    ? state.makeupConsultSessions.find((s) => s.id === sessionId)
    : null

  const [isoDate, setIsoDate] = useState(() =>
    existing?.dateISO ? String(existing.dateISO).slice(0, 10) : isoDateOnly(),
  )
  const [memo, setMemo] = useState(existing?.memo ?? '')
  const [lines, setLines] = useState(() => {
    if (existing?.products?.length) {
      return existing.products.map((p) => ({
        lineId: p.lineId ?? createId(),
        category: p.category ?? MAKEUP_DAY_CATEGORIES[0],
        brand: p.brand ?? '',
        productName: p.productName ?? '',
        shade: p.shade ?? '',
        memo: p.memo ?? '',
      }))
    }
    return [blankLine()]
  })

  const filledCount = useMemo(
    () => lines.filter((l) => String(l.productName).trim()).length,
    [lines],
  )
  const canSave = filledCount > 0

  function updateLine(idx, patch) {
    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }

  function removeLine(idx) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
  }

  function addLine() {
    setLines((prev) => [...prev, blankLine()])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!customer) return
    actions.upsertMakeupSession({
      id: existing?.id,
      customerId: customer.id,
      dateISO: new Date(`${isoDate}T12:00:00`).toISOString(),
      memo,
      products: lines.map((l) => ({
        lineId: l.lineId,
        category: l.category,
        brand: String(l.brand).trim(),
        productName: String(l.productName).trim(),
        shade: String(l.shade).trim(),
        memo: String(l.memo).trim(),
      })),
    })
    toast(existing ? '컨설팅 기록을 수정했습니다.' : '컨설팅 기록을 저장했습니다.')
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  function removeSession() {
    if (!existing || !customer) return
    if (!window.confirm('이 컨설팅 기록을 삭제할까요?')) return
    actions.deleteMakeupSession(existing.id, customer.id)
    toast('컨설팅 기록을 삭제했습니다.', { tone: 'info' })
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  if (!customer) {
    return (
      <div>
        <PageHeader title="고객을 찾지 못했습니다" back="/customers" />
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          고객 목록으로
        </Button>
      </div>
    )
  }

  if (!isNew && !existing) {
    return (
      <div>
        <PageHeader title="기록을 찾을 수 없습니다" back={`/customers/${customerId}`} />
        <Button variant="secondary" onClick={() => navigate(`/customers/${customerId}`)}>
          돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className={FORM_BOTTOM_SPACE}>
      <PageHeader
        kicker="Makeup Consult"
        title={isNew ? '메이크업 컨설팅' : '컨설팅 기록 수정'}
        subtitle={`${customer.name}님 · 당일 사용 제품을 기록합니다`}
        back={`/customers/${customer.id}`}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <Field label="컨설팅 일자">
            <DateInput
              required
              value={isoDate}
              onChange={(e) => e.target.value && setIsoDate(e.target.value)}
            />
          </Field>
        </Card>

        <section>
          <SectionHeader
            kicker="Products"
            title="사용 제품"
            count={`${filledCount}/${lines.length}`}
          />
          <ul className="flex flex-col gap-3">
            {lines.map((row, idx) => (
              <ProductLine
                key={row.lineId}
                row={row}
                index={idx}
                canRemove={lines.length > 1}
                onChange={(patch) => updateLine(idx, patch)}
                onRemove={() => removeLine(idx)}
              />
            ))}
          </ul>
          <Button variant="quiet" className="mt-3 w-full" icon="plus" onClick={addLine}>
            제품 추가
          </Button>
        </section>

        <Card>
          <Field label="컨설팅 전체 메모">
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="전체 컨셉, 홈케어 안내 등"
            />
          </Field>
        </Card>

        {existing ? (
          <Button variant="dangerQuiet" className="w-full" icon="trash" onClick={removeSession}>
            이 기록 삭제
          </Button>
        ) : null}

        <FormActionBar>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(`/customers/${customer.id}`)}
          >
            닫기
          </Button>
          <Button
            type="submit"
            className="flex-[1.6]"
            disabled={!canSave}
            title={!canSave ? '최소 한 개는 제품명을 입력해야 저장됩니다.' : undefined}
          >
            저장
          </Button>
        </FormActionBar>
      </form>
    </div>
  )
}
