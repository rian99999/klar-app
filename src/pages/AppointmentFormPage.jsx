import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { APPOINTMENT_COURSES } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { formatDateShort, isoDateOnly, relativeDayLabel } from '../lib/format.js'
import { cn } from '../lib/cn.js'
import {
  Button,
  Card,
  DateInput,
  Field,
  FORM_BOTTOM_SPACE,
  FormActionBar,
  PageHeader,
  Select,
  Textarea,
  TimeInput,
} from '../components/Ui.jsx'

/** Common salon slots — one tap instead of scrolling the native time wheel. */
const QUICK_TIMES = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '19:00']

export function AppointmentFormPage({ mode }) {
  const navigate = useNavigate()
  const { appointmentId } = useParams()
  const [params] = useSearchParams()
  const { state, actions } = useAppData()
  const { toast } = useToast()

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

  /** Warns about a double booking without blocking it — the studio decides. */
  const conflict = useMemo(() => {
    if (!time) return null
    return state.appointments.find(
      (a) => a.id !== existing?.id && a.date === date && a.time === time,
    )
  }, [date, time, state.appointments, existing?.id])

  function submit(e) {
    e.preventDefault()
    if (!customerId) {
      toast('고객을 선택해 주세요.', { tone: 'error' })
      return
    }
    actions.upsertAppointment({ id: existing?.id, date, time, customerId, course, note })
    toast(existing ? '예약을 수정했습니다.' : '예약을 등록했습니다.')
    navigate('/appointments', { replace: true })
  }

  function remove() {
    if (!existing) return
    if (!window.confirm('이 예약을 삭제할까요?')) return
    actions.deleteAppointment(existing.id)
    toast('예약을 삭제했습니다.', { tone: 'info' })
    navigate('/appointments', { replace: true })
  }

  if (mode === 'edit' && !existing) {
    return (
      <div>
        <PageHeader title="예약을 찾을 수 없습니다" back="/appointments" />
        <Button variant="secondary" onClick={() => navigate('/appointments')}>
          예약 목록으로
        </Button>
      </div>
    )
  }

  const hasCustomers = sortedCustomers.length > 0

  return (
    <div className={FORM_BOTTOM_SPACE}>
      <PageHeader
        title={existing ? '예약 수정' : '예약 만들기'}
        subtitle={`${formatDateShort(`${date}T12:00:00`)} · ${relativeDayLabel(date)}`}
        back="/appointments"
      />

      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-5">
          <Field label="일정 날짜">
            <DateInput
              required
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </Field>

          <Field
            label="시각"
            hint={conflict ? undefined : '자주 쓰는 시간대를 눌러 바로 채울 수 있습니다.'}
            error={conflict ? '같은 날짜·시각에 이미 다른 예약이 있습니다.' : undefined}
          >
            <TimeInput value={time} onChange={(e) => setTime(e.target.value)} />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {QUICK_TIMES.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums transition',
                    time === slot
                      ? 'border-klar-600 bg-klar-600 text-white'
                      : 'border-line-strong bg-white text-ink-soft hover:border-klar-400',
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label="고객"
            hint={hasCustomers ? undefined : '먼저 고객을 등록해야 예약을 연결할 수 있습니다.'}
          >
            <Select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={!hasCustomers}
            >
              <option value="">고객을 선택하세요</option>
              {sortedCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ''}
                </option>
              ))}
            </Select>
            {!hasCustomers ? (
              <Button
                variant="quiet"
                size="sm"
                className="mt-2 w-full"
                icon="plus"
                onClick={() => navigate('/customers/new')}
              >
                고객 등록하러 가기
              </Button>
            ) : null}
          </Field>

          <Field
            label="예약 코스"
            hint="패키지는 아래 메모에 세부 구성도 함께 적어 두세요."
          >
            <Select value={course} onChange={(e) => setCourse(e.target.value)}>
              {APPOINTMENT_COURSES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="메모 · 준비 사항">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="요청 사항, 준비할 제품 등"
            />
          </Field>
        </Card>

        {existing ? (
          <Button variant="dangerQuiet" className="w-full" icon="trash" onClick={remove}>
            예약 삭제
          </Button>
        ) : null}

        <FormActionBar>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate('/appointments')}
          >
            취소
          </Button>
          <Button type="submit" className="flex-[1.6]">
            저장
          </Button>
        </FormActionBar>
      </form>
    </div>
  )
}
