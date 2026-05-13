import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PERSONAL_TYPES } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { isoDateOnly } from '../lib/format.js'
import { Button, Card, Field, PageHeader, Select, Textarea } from '../components/Ui.jsx'

export function PersonalColorFormPage({ mode }) {
  const isNew = mode === 'new'
  const { customerId, sessionId } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useAppData()

  const customer = state.customers.find((c) => c.id === customerId)
  const existing = !isNew
    ? state.personalColorSessions.find((s) => s.id === sessionId)
    : null

  const [tone, setTone] = useState(existing?.tone ?? 'warm')
  const [primary, setPrimary] = useState(existing?.primaryTypeKey ?? '')
  const [secondary, setSecondary] = useState(existing?.secondaryTypeKey ?? '')
  const [memo, setMemo] = useState(existing?.memo ?? '')
  const [isoDate, setIsoDate] = useState(() => {
    if (existing?.dateISO)
      return String(existing.dateISO).slice(0, 10)
    return isoDateOnly()
  })

  const typed = useMemo(
    () => PERSONAL_TYPES.filter((t) => t.undertone === tone),
    [tone],
  )

  function handleSubmit(e) {
    e.preventDefault()
    if (!customer) return
    if (!primary) {
      alert('1순위 타입을 선택해 주세요.')
      return
    }
    if (!typed.some((t) => t.key === primary)) {
      alert('선택한 베이스 톤에 맞는 타입으로 다시 선택해 주세요.')
      return
    }
    if (secondary && secondary === primary) {
      alert('2순위 타입은 1순위와 달라야 합니다.')
      return
    }
    const dt = `${isoDate}T12:00:00`
    actions.upsertPersonalSession({
      id: existing?.id,
      customerId: customer.id,
      dateISO: new Date(dt).toISOString(),
      tone,
      primaryTypeKey: primary,
      secondaryTypeKey: secondary || null,
      memo,
    })
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  function remove() {
    if (!existing || !customer) return
    if (!window.confirm('이 결과지를 삭제할까요?')) return
    actions.deletePersonalSession(existing.id, customer.id)
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  if (!customer) {
    return (
      <div>
        <PageHeader title="고객을 찾지 못했습니다" />
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          목록으로
        </Button>
      </div>
    )
  }

  if (!isNew && !existing) {
    return (
      <div>
        <PageHeader title="결과지 없음" />
        <Button variant="secondary" onClick={() => navigate(`/customers/${customerId}`)}>
          돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={isNew ? '퍼스널컬러 결과지 작성' : '퍼스널컬러 결과지 수정'}
        subtitle={`${customer.name}`}
      />

      <form onSubmit={handleSubmit}>
        {!isNew ? (
          <div className="mb-3">
            <Button type="button" variant="danger" className="w-full" onClick={remove}>
              이 결과지 삭제
            </Button>
          </div>
        ) : null}
        <Card className="mb-28 space-y-4">
          <Field label="진단 일자">
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-klar-500/40 focus:border-klar-400 focus:ring-2"
              value={isoDate}
              onChange={(e) => setIsoDate(e.target.value)}
              required
            />
          </Field>

          <Field label="베이스 톤">
            <Select
              value={tone}
              onChange={(e) => {
                const v = e.target.value
                setTone(v)
                setPrimary('')
                setSecondary('')
              }}
            >
              <option value="warm">웜톤</option>
              <option value="cool">쿨톤</option>
            </Select>
          </Field>

          <Field label="1순위 퍼스널컬러 타입">
            <Select value={primary} onChange={(e) => setPrimary(e.target.value)} required>
              <option value="">선택...</option>
              {typed.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="2순위 타입 (선택)">
            <Select
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
            >
              <option value="">없음</option>
              {typed
                .filter((t) => t.key !== primary)
                .map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="진단 메모 · 특이사항">
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
          </Field>
        </Card>

        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              닫기
            </Button>
            <Button type="submit" className="flex-1 shadow-lg shadow-klar-900/10">
              저장
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
