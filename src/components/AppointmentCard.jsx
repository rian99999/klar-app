import { Link } from 'react-router-dom'
import { APPOINTMENT_COURSE_MAP } from '../data/constants.js'
import { formatDateShort, formatTime, phoneDigits, relativeDayLabel } from '../lib/format.js'
import { cn } from '../lib/cn.js'
import { Icon } from './Icon.jsx'
import { Badge, CardLink } from './Ui.jsx'

/**
 * One appointment row for every surface that lists appointments
 * (dashboard "오늘/다가오는 예약", 예약 관리 목록).
 * `tone="solid"` highlights the time block for the day in focus.
 */
export function AppointmentCard({ appointment, customer, showDate = false, tone = 'soft' }) {
  const solid = tone === 'solid'
  const digits = phoneDigits(customer?.phone)
  const courseLabel =
    APPOINTMENT_COURSE_MAP[appointment.course] ?? appointment.course

  return (
    <CardLink className="relative p-0">
      <div className="flex items-stretch">
        <div
          className={cn(
            'flex w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-l-lg px-2 py-3',
            solid ? 'bg-klar-700 text-white' : 'bg-klar-100 text-klar-800',
          )}
        >
          <p className="text-[17px] font-semibold leading-none tabular-nums">
            {formatTime(appointment.time)}
          </p>
          {showDate ? (
            <p
              className={cn(
                'mt-1.5 text-[10px] font-medium',
                solid ? 'text-klar-200' : 'text-klar-600',
              )}
            >
              {relativeDayLabel(appointment.date)}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3.5 py-3">
          <Link
            to={`/appointments/${appointment.id}/edit`}
            className="truncate text-[15px] font-semibold text-ink after:absolute after:inset-0 after:content-['']"
          >
            {customer?.name ?? '고객 미지정'}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{courseLabel}</Badge>
            {showDate ? (
              <span className="text-[11px] text-ink-muted">
                {formatDateShort(`${appointment.date}T12:00:00`)}
              </span>
            ) : null}
          </div>
          {appointment.note ? (
            <p className="line-clamp-2 text-xs leading-5 text-ink-muted">
              {appointment.note}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 pr-2.5">
          {digits ? (
            <a
              href={`tel:${digits}`}
              aria-label={`${customer?.name ?? '고객'}에게 전화`}
              title="전화 걸기"
              className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-klar-100 hover:text-klar-700"
            >
              <Icon name="phone" className="h-[1.05rem] w-[1.05rem]" />
            </a>
          ) : null}
          <Icon name="chevronRight" className="h-4 w-4 text-ink-faint" />
        </div>
      </div>
    </CardLink>
  )
}
