import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { APPOINTMENT_COURSE_MAP } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import {
  formatTime,
  isoDateOnly,
  relativeDayLabel,
  formatDateShort,
} from '../lib/format.js'
import { Icon, Wordmark } from '../components/Icon.jsx'
import {
  Badge,
  Button,
  CardLink,
  EmptyState,
  SectionHeader,
  SkeletonList,
  StatTile,
} from '../components/Ui.jsx'

const PALETTE = ['#EDF6FC', '#BFE0F2', '#5BA8CD', '#0E5FA8', '#E2D4C0']

const QUICK_ACTIONS = [
  { to: '/customers/new', label: '고객 등록', icon: 'users' },
  { to: '/appointments/new', label: '예약 잡기', icon: 'calendar' },
  { to: '/makeup', label: '제품 찾기', icon: 'lipstick' },
]

function AppointmentRow({ appointment, customerName, showDate }) {
  return (
    <Link to={`/appointments/${appointment.id}/edit`} className="block">
      <CardLink className="p-0">
        <div className="flex items-stretch">
          <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-l-lg bg-klar-700 px-2 py-3 text-white">
            <p className="text-lg font-semibold leading-none tabular-nums">
              {formatTime(appointment.time)}
            </p>
            {showDate ? (
              <p className="mt-1.5 text-[10px] font-medium text-klar-200">
                {relativeDayLabel(appointment.date)}
              </p>
            ) : (
              <p className="mt-1.5 text-[9px] uppercase tracking-brand text-klar-300">
                time
              </p>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3">
            <p className="truncate text-[15px] font-semibold text-ink">
              {customerName ?? '미지정 고객'}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">
                {APPOINTMENT_COURSE_MAP[appointment.course] ?? appointment.course}
              </Badge>
              {showDate ? (
                <span className="text-[11px] text-ink-muted">
                  {formatDateShort(`${appointment.date}T12:00:00`)}
                </span>
              ) : null}
            </div>
            {appointment.note ? (
              <p className="line-clamp-1 text-xs text-ink-muted">{appointment.note}</p>
            ) : null}
          </div>
          <Icon
            name="chevronRight"
            className="my-auto mr-3 h-4 w-4 text-ink-faint"
          />
        </div>
      </CardLink>
    </Link>
  )
}

export function DashboardPage() {
  const { state, ready } = useAppData()
  const today = isoDateOnly()

  const customerNameById = useMemo(
    () => new Map(state.customers.map((c) => [c.id, c.name])),
    [state.customers],
  )

  const { todayAppts, upcomingAppts } = useMemo(() => {
    const sorted = [...state.appointments].sort(
      (a, b) =>
        String(a.date).localeCompare(String(b.date)) ||
        String(a.time || '').localeCompare(String(b.time || '')),
    )
    return {
      todayAppts: sorted.filter((a) => a.date === today),
      upcomingAppts: sorted.filter((a) => a.date > today).slice(0, 3),
    }
  }, [state.appointments, today])

  const recentCustomers = useMemo(
    () =>
      [...state.customers]
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        .slice(0, 5),
    [state.customers],
  )

  const sessionCount =
    state.personalColorSessions.length + state.makeupConsultSessions.length

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-xl border border-line bg-white/85 shadow-card">
        <div className="relative bg-gradient-to-br from-klar-100 via-klar-50 to-pearl-50 px-5 pb-6 pt-7">
          <div className="absolute right-4 top-5 flex gap-1.5" aria-hidden>
            {PALETTE.map((color) => (
              <span
                key={color}
                className="h-5 w-5 rounded-full border border-white/80 shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="brand-kicker mb-3">Color &amp; Makeup</p>
          <Wordmark className="block text-5xl text-klar-700" />
          <p className="mt-3 max-w-[20rem] text-sm leading-7 text-ink-soft">
            당신이 가장 빛나는 색을, 우리가 찾아드립니다.
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line border-t border-line bg-white/80">
          <StatTile label="Today" value={todayAppts.length} suffix="건" />
          <StatTile label="Clients" value={state.customers.length} suffix="명" />
          <StatTile label="Records" value={sessionCount} suffix="건" />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="sr-only">바로가기</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.to} to={action.to} className="block">
              <div className="flex h-full flex-col items-center gap-2 rounded-lg border border-line bg-white/85 px-2 py-4 text-center shadow-card transition duration-200 ease-smooth hover:-translate-y-0.5 hover:border-klar-300 hover:shadow-lift">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-klar-100 text-klar-600">
                  <Icon name={action.icon} className="h-[1.15rem] w-[1.15rem]" />
                </span>
                <span className="text-[13px] font-semibold text-ink">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Today */}
      <section>
        <SectionHeader
          kicker="Schedule"
          title="오늘 예약"
          count={todayAppts.length || undefined}
          action={
            <Link to="/appointments">
              <Button variant="ghost" size="sm" iconRight="chevronRight">
                전체 보기
              </Button>
            </Link>
          }
        />
        {!ready && state.appointments.length === 0 ? (
          <SkeletonList rows={2} />
        ) : todayAppts.length === 0 ? (
          <EmptyState
            icon="clock"
            title="오늘 등록된 예약이 없습니다"
            description="새 예약을 잡거나 다른 날짜의 일정을 확인해 보세요."
            action={
              <Link to={`/appointments/new?date=${today}`}>
                <Button className="w-full" icon="plus">
                  예약 만들기
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {todayAppts.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentRow
                  appointment={appointment}
                  customerName={customerNameById.get(appointment.customerId)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Upcoming */}
      {upcomingAppts.length > 0 ? (
        <section>
          <SectionHeader kicker="Upcoming" title="다가오는 예약" />
          <ul className="flex flex-col gap-2.5">
            {upcomingAppts.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentRow
                  appointment={appointment}
                  customerName={customerNameById.get(appointment.customerId)}
                  showDate
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Recent clients */}
      <section>
        <SectionHeader
          kicker="Clients"
          title="최근 고객"
          action={
            <Link to="/customers">
              <Button variant="ghost" size="sm" iconRight="chevronRight">
                고객 관리
              </Button>
            </Link>
          }
        />
        {recentCustomers.length === 0 ? (
          <EmptyState
            icon="users"
            title="등록된 고객이 없습니다"
            description="첫 고객을 등록하면 진단 기록과 결과지를 함께 관리할 수 있어요."
            action={
              <Link to="/customers/new">
                <Button className="w-full" icon="plus">
                  신규 고객 등록
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {recentCustomers.map((customer) => (
              <li key={customer.id}>
                <Link to={`/customers/${customer.id}`} className="block">
                  <CardLink>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-klar-100 to-pearl-100 text-sm font-semibold text-klar-700">
                        {String(customer.name ?? '?').trim().charAt(0) || '?'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{customer.name}</p>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {customer.phone || '연락처 미입력'}
                        </p>
                      </div>
                      <Icon name="chevronRight" className="h-4 w-4 text-ink-faint" />
                    </div>
                  </CardLink>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
