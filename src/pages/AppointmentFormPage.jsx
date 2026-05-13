import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { APPOINTMENT_COURSES } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { isoDateOnly } from '../lib/format.js'
import { Button, Card, Field, Input, Label, PageHeader, Select, Textarea } from '../components/Ui.jsx'

export function AppointmentFormPage({ mode }) {
  const navigate = useNavigate()
  const { appointmentId } = useParams()
  const [params] = useSearchParams()

  const { state, actions } = useAppData()

  const existing =
    mode === 'edit' && appointmentId
      ? state.appointments.find((a) => a.id === appointmentId)
      : null

  const [date, setDate] = useState(
    () => existing?.date ?? params.get('date') ?? isoDateOnly(),
  )
  const [time, setTime] = useState(() => existing?.time ?? '')
  const [customerId, setCustomerId] = useState(() => existing?.customerId ?? '')
  const [course, setCourse] = useState(
    () => existing?.course ?? APPOINTMENT_COURSES[0].key,
  )
  const [note, setNote] = useState(() => existing?.note ?? '')

  const sortedCustomers = useMemo(
    () =>
      [...state.customers].sort((a, b) =>
        String(a.name).localeCompare(String(b.name), 'ko'),
      ),
    [state.customers],
  )

  function submit(e) {
    e.preventDefault()
    if (!customerId) {
      alert('고객을 선택해 주세요.')
      return
    }
    actions.upsertAppointment({
      id: existing?.id,
      date,
      time,
      customerId,
      course,
      note,
    })
    navigate('/appointments', { replace: true })
  }

  function remove() {
    if (!existing) return
    if (!window.confirm('이 예약을 삭제할까요?')) return
    actions.deleteAppointment(existing.id)
    navigate('/appointments', { replace: true })
  }

  if (mode === 'edit' && !existing) {
    return (
      <div>
        <PageHeader title="예약 미확인" />
        <Button variant="secondary" onClick={() => navigate('/appointments')}>
          캘린더로 이동
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={existing ? '예약 수정' : '예약 만들기'} />

      {existing ? (
        <Button variant="danger" className="mb-3 w-full" type="button" onClick={remove}>
          예약 삭제
        </Button>
      ) : null}

      <form onSubmit={submit}>
        <Card className="mb-28 space-y-4">
          <Field label="일정 날짜">
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-klar-500/40 focus:border-klar-400 focus:ring-2"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="시각 (예: 14:00)">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <div>
            <Label>고객 연동 · 선택</Label>
            <Select
              required
              className="mt-1.5"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">고객을 선택...</option>
              {sortedCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` · ${c.phone}` : ''}
                </option>
              ))}
            </Select>
          </div>
          <Field label="예약 코스">
            <Select value={course} onChange={(e) => setCourse(e.target.value)}>
              {APPOINTMENT_COURSES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-[11px] text-slate-500">
              패키지는 메모 필드로 세부 패키지 구성도 함께 적어 두세요.
            </p>
          </Field>
          <Field label="메모 · 준비 사항">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </Card>

        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 border-t border-white/60 bg-white/95 backdrop-blur-md px-4 py-3">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate('/appointments')}
            >
              취소
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
