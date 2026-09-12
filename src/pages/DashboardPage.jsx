import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import { formatDateKo, isoDateOnly, weekDatesOf } from '../lib/format.js'
import { Icon, Wordmark } from '../components/Icon.jsx'
import { AppointmentCard } from '../components/AppointmentCard.jsx'
import { CustomerCard } from '../components/CustomerCard.jsx'
import {
  Button,
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

/** A greeting beats a bare dashboard when the app is opened many times a day. */
function greeting(hour = new Date().getHours()) {
  if (hour < 6) return '늦은 시간까지 수고 많으세요'
  if (hour < 11) return '좋은 아침이에요'
  if (hour < 14) return '점심 전후로 바쁘시죠'
  if (hour < 18) return '오늘도 잘 하고 계세요'
  return '오늘 하루도 고생하셨어요'
}

export function DashboardPage() {
  const { state, ready } = useAppData()
  const today = isoDateOnly()

  const customerById = useMemo(
    () => new Map(state.customers.map((c) => [c.id, c])),
    [state.customers],
  )

  const { todayAppts, upcomingAppts, weekCount } = useMemo(() => {
    const sorted = [...state.appointments].sort(
      (a, b) =>
        String(a.date).localeCompare(String(b.date)) ||
        String(a.time || '').localeCompare(String(b.time || '')),
    )
    const week = new Set(weekDatesOf(today))
    return {
      todayAppts: sorted.filter((a) => a.date === today),
      upcomingAppts: sorted.filter((a) => a.date > today).slice(0, 3),
      weekCount: sorted.filter((a) => week.has(a.date)).length,
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
          <p className="mt-4 text-[15px] font-semibold text-ink">{greeting()}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {formatDateKo(`${today}T12:00:00`)} · 오늘 예약 {todayAppts.length}건
          </p>
        </div>
        <div className="grid grid-cols-4 divide-x divide-line border-t border-line bg-white/80">
          <StatTile label="오늘" value={todayAppts.length} suffix="건" className="px-2.5" />
          <StatTile label="이번 주" value={weekCount} suffix="건" className="px-2.5" />
          <StatTile label="고객" value={state.customers.length} suffix="명" className="px-2.5" />
          <StatTile label="기록" value={sessionCount} suffix="건" className="px-2.5" />
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
                <AppointmentCard
                  appointment={appointment}
                  customer={customerById.get(appointment.customerId)}
                  tone="solid"
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
                <AppointmentCard
                  appointment={appointment}
                  customer={customerById.get(appointment.customerId)}
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
                <CustomerCard customer={customer} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
