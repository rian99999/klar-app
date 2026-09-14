import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import {
  dayOfMonth,
  formatDateShort,
  isoDateOnly,
  relativeDayLabel,
  shiftIsoDate,
  weekDatesOf,
  weekdayKo,
} from '../lib/format.js'
import { cn } from '../lib/cn.js'
import { Icon } from '../components/Icon.jsx'
import { AppointmentCard } from '../components/AppointmentCard.jsx'
import {
  Button,
  Card,
  DateInput,
  EmptyState,
  PageHeader,
} from '../components/Ui.jsx'

/** Weekday strip so the whole week is scannable without opening a date picker. */
function WeekStrip({ selected, onSelect, countsByDate, today }) {
  const week = useMemo(() => weekDatesOf(selected), [selected])

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="이전 주"
        onClick={() => onSelect(shiftIsoDate(selected, -7))}
        className="flex h-11 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition hover:bg-klar-100 hover:text-klar-700"
      >
        <Icon name="chevronLeft" className="h-4 w-4" />
      </button>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {week.map((iso) => {
          const active = iso === selected
          const isToday = iso === today
          const count = countsByDate.get(iso) ?? 0
          const weekday = weekdayKo(iso)
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={active}
              aria-label={`${formatDateShort(`${iso}T12:00:00`)} 예약 ${count}건`}
              onClick={() => onSelect(iso)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md py-2 transition duration-200 ease-smooth',
                active
                  ? 'bg-klar-700 text-white shadow-lift'
                  : 'text-ink-soft hover:bg-klar-100',
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-semibold',
                  active
                    ? 'text-klar-200'
                    : weekday === '일'
                      ? 'text-rose-400'
                      : weekday === '토'
                        ? 'text-klar-500'
                        : 'text-ink-faint',
                )}
              >
                {weekday}
              </span>
              <span
                className={cn(
                  'text-[15px] font-semibold leading-none tabular-nums',
                  !active && isToday ? 'text-klar-600' : null,
                )}
              >
                {dayOfMonth(iso)}
              </span>
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  count > 0
                    ? active
                      ? 'bg-white'
                      : 'bg-klar-500'
                    : 'bg-transparent',
                )}
              />
            </button>
          )
        })}
      </div>
      <button
        type="button"
        aria-label="다음 주"
        onClick={() => onSelect(shiftIsoDate(selected, 7))}
        className="flex h-11 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition hover:bg-klar-100 hover:text-klar-700"
      >
        <Icon name="chevronRight" className="h-4 w-4" />
      </button>
    </div>
  )
}

export function AppointmentsPage() {
  const { state } = useAppData()
  const today = isoDateOnly()
  const [date, setDate] = useState(today)

  const countsByDate = useMemo(() => {
    const counts = new Map()
    state.appointments.forEach((a) => {
      counts.set(a.date, (counts.get(a.date) ?? 0) + 1)
    })
    return counts
  }, [state.appointments])

  const customerById = useMemo(
    () => new Map(state.customers.map((c) => [c.id, c])),
    [state.customers],
  )

  const list = useMemo(
    () =>
      state.appointments
        .filter((a) => a.date === date)
        .slice()
        .sort((a, b) => String(a.time || '').localeCompare(String(b.time || ''))),
    [date, state.appointments],
  )

  return (
    <div>
      <PageHeader
        title="예약 관리"
        subtitle={`${formatDateShort(`${date}T12:00:00`)} · ${relativeDayLabel(date, today)}`}
        right={
          <Link to={`/appointments/new?date=${encodeURIComponent(date)}`}>
            <Button size="sm" icon="plus">
              등록
            </Button>
          </Link>
        }
      />

      <Card className="mb-5 space-y-3 p-3">
        <WeekStrip
          selected={date}
          onSelect={setDate}
          countsByDate={countsByDate}
          today={today}
        />
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <DateInput
            className="flex-1 py-2.5 text-sm"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="조회 일자"
          />
          <Button
            variant={date === today ? 'subtle' : 'secondary'}
            size="sm"
            onClick={() => setDate(today)}
          >
            오늘
          </Button>
        </div>
      </Card>

      {list.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="이 날짜에는 예약이 없습니다"
          description="위 주간 달력에서 점이 있는 날짜에 일정이 등록되어 있어요."
          action={
            <Link to={`/appointments/new?date=${encodeURIComponent(date)}`}>
              <Button className="w-full" icon="plus">
                예약 만들기
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {list.map((appointment) => (
            <li key={appointment.id}>
              <AppointmentCard
                appointment={appointment}
                customer={customerById.get(appointment.customerId)}
                tone={date === today ? 'solid' : 'soft'}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
