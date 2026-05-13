import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MAKEUP_DAY_CATEGORIES } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { createId } from '../lib/ids.js'
import { isoDateOnly } from '../lib/format.js'
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from '../components/Ui.jsx'
import { cn } from '../lib/cn.js'

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

export function MakeupConsultFormPage({ mode }) {
  const isNew = mode === 'new'
  const { customerId, sessionId } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useAppData()

  const customer = state.customers.find((c) => c.id === customerId)
  const existing = !isNew
    ? state.makeupConsultSessions.find((s) => s.id === sessionId)
    : null

  const [isoDate, setIsoDate] = useState(() => {
    if (existing?.dateISO) return String(existing.dateISO).slice(0, 10)
    return isoDateOnly()
  })
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

  const canSave = useMemo(
    () => lines.some((l) => String(l.productName).trim()),
    [lines],
  )

  function updateLine(idx, patch) {
    setLines((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    )
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
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  function removeSession() {
    if (!existing || !customer) return
    if (!window.confirm('이 컨설팅 기록을 삭제할까요?')) return
    actions.deleteMakeupSession(existing.id, customer.id)
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  if (!customer) {
    return (
      <div>
        <PageHeader title="고객 미확인" />
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          목록으로
        </Button>
      </div>
    )
  }

  if (!isNew && !existing) {
    return (
      <div>
        <PageHeader title="기록 없음" />
        <Button variant="secondary" onClick={() => navigate(`/customers/${customerId}`)}>
          돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={isNew ? '메이크업 컨설팅 · 사용 제품' : '메이크업 컨설팅 · 수정'}
        subtitle={customer.name}
      />

      <form onSubmit={handleSubmit}>
        {!isNew ? (
          <div className="mb-3">
            <Button type="button" variant="danger" className="w-full" onClick={removeSession}>
              이 기록 삭제
            </Button>
          </div>
        ) : null}

        <Card className="mb-6 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-klar-900">
              컨설팅 당일 제품 기록
            </p>
            <p className="mt-1 text-xs text-slate-500">
              카테고리별 립부터 마스카라까지 현장 사용 제품을 남겨 두세요.
            </p>
          </div>

          <Field label="컨설팅 일자">
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-klar-500/40 focus:border-klar-400 focus:ring-2"
              value={isoDate}
              onChange={(e) => setIsoDate(e.target.value)}
              required
            />
          </Field>

          <div>
            <LabelRows />
            <ul className="mt-2 flex flex-col gap-4">
              {lines.map((row, idx) => (
                <Card
                  key={row.lineId}
                  className="border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-3"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-[11px] font-semibold text-slate-600">
                      제품 카드 #{idx + 1}
                    </p>
                    <button
                      type="button"
                      className="text-[11px] font-medium text-slate-400 hover:text-red-600"
                      onClick={() => removeLine(idx)}
                    >
                      행 삭제
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Field label="카테고리">
                      <Select
                        value={row.category}
                        onChange={(e) =>
                          updateLine(idx, { category: e.target.value })
                        }
                      >
                        {MAKEUP_DAY_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="브랜드명">
                      <Input
                        value={row.brand}
                        onChange={(e) => updateLine(idx, { brand: e.target.value })}
                        placeholder="브랜드"
                      />
                    </Field>
                    <Field label="제품명">
                      <Input
                        value={row.productName}
                        onChange={(e) =>
                          updateLine(idx, { productName: e.target.value })
                        }
                        placeholder="제품 라인 이름"
                      />
                    </Field>
                    <Field label="색상 / 번호">
                      <Input
                        value={row.shade}
                        onChange={(e) => updateLine(idx, { shade: e.target.value })}
                        placeholder="# / 시즌 라벨 등"
                      />
                    </Field>
                    <Field label="메모">
                      <Textarea
                        className="min-h-[72px]"
                        value={row.memo}
                        onChange={(e) => updateLine(idx, { memo: e.target.value })}
                        placeholder="연출 포인트, 발색 메모 등"
                      />
                    </Field>
                  </div>
                </Card>
              ))}
            </ul>
            <button
              type="button"
              className={cn(
                'mt-3 w-full rounded-2xl border border-dashed border-klar-200 bg-klar-50/60 px-4 py-3 text-sm font-medium text-klar-900 hover:bg-klar-50',
              )}
              onClick={addLine}
            >
              + 제품 행 추가
            </button>
          </div>
        </Card>

        <Card className="mb-28">
          <Field label="컨설팅 전체 메모">
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
          </Field>
        </Card>

        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              닫기
            </Button>
            <Button
              type="submit"
              disabled={!canSave}
              className="flex-1 shadow-lg shadow-klar-900/10"
              title={
                !canSave ? '최소 한 줄은 제품명을 입력해야 저장됩니다.' : undefined
              }
            >
              저장
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function LabelRows() {
  return (
    <p className="text-[11px] font-semibold text-slate-600">
      제품 카드 목록
    </p>
  )
}
