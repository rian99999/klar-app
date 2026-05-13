import { Link } from 'react-router-dom'
import {
  APPOINTMENT_COURSE_MAP,
} from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { Button, Card } from '../components/Ui.jsx'

function todayLocalISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function DashboardPage() {
  const { state } = useAppData()
  const iso = todayLocalISO()

  const todayAppts = state.appointments
    .filter((a) => a.date === iso)
    .slice()
    .sort((a, b) =>
      String(a.time || '').localeCompare(String(b.time || '')),
    )

  const recentCustomers = [...state.customers]
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 5)

  return (
    <div>
      <section className="mb-7 overflow-hidden rounded-[18px] border border-klar-200 bg-white/80 shadow-card">
        <div className="relative bg-klar-100 px-5 pb-5 pt-6">
          <div className="absolute right-4 top-4 flex gap-1.5">
            {['#EDF6FC', '#BFE0F2', '#5BA8CD', '#0E5FA8', '#E2D4C0'].map((color) => (
              <span
                key={color}
                className="h-5 w-5 rounded-full border border-white/70 shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="brand-kicker mb-3">Color & Makeup</p>
          <h1 className="font-display text-5xl leading-none tracking-tight text-klar-700">
            kl<span className="italic text-klar-500">a</span>r
          </h1>
          <p className="mt-3 text-sm font-light leading-7 text-klar-600">
            당신이 가장 빛나는 색을, 우리가 찾아드립니다.
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-klar-200 border-t border-klar-200 bg-white/75">
          <div className="px-4 py-3">
            <p className="brand-kicker">Today</p>
            <p className="mt-1 text-xl font-medium tabular-nums text-klar-900">
              {todayAppts.length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="brand-kicker">Clients</p>
            <p className="mt-1 text-xl font-medium tabular-nums text-klar-900">
              {state.customers.length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="brand-kicker">Date</p>
            <p className="mt-1 text-xs font-medium leading-6 text-klar-900">{iso}</p>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="brand-kicker">Schedule</p>
            <h2 className="brand-title text-xl">오늘 예약</h2>
          </div>
          <Link to="/appointments">
            <Button variant="ghost" className="py-2 text-xs">
              전체 예약 보기
            </Button>
          </Link>
        </div>
        {todayAppts.length === 0 ? (
          <Card className="border-dashed border-klar-200 bg-white/60 py-7 text-center text-sm text-klar-500">
            오늘 등록된 예약이 없습니다.
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {todayAppts.map((a) => {
              const c = state.customers.find((x) => x.id === a.customerId)
              return (
                <li key={a.id}>
                  <Card className="overflow-hidden border-klar-200 p-0">
                    <div className="flex items-stretch gap-3">
                      <div className="w-16 shrink-0 bg-klar-700 text-center text-white">
                        <p className="pt-3 text-xl font-medium tabular-nums">
                          {(a.time || '--:--').slice(0, 5)}
                        </p>
                        <p className="pb-3 text-[10px] uppercase tracking-[0.18em] text-klar-300">
                          time
                        </p>
                      </div>
                      <div className="flex flex-1 flex-col gap-1 py-3 pr-3">
                        <p className="font-medium text-klar-900">
                          {c?.name ?? '미지정 고객'}
                        </p>
                        <p className="text-xs text-klar-600">
                          {APPOINTMENT_COURSE_MAP[a.course] ?? a.course}
                        </p>
                        {a.note ? (
                          <p className="line-clamp-2 text-xs text-klar-500">{a.note}</p>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="brand-kicker">Clients</p>
            <h2 className="brand-title text-xl">최근 고객</h2>
          </div>
          <Link to="/customers">
            <Button variant="ghost" className="py-2 text-xs">
              고객 관리로
            </Button>
          </Link>
        </div>
        {recentCustomers.length === 0 ? (
          <Card className="border-dashed border-klar-200 bg-white/60 py-7 text-center">
            <p className="mb-4 text-sm text-klar-500">등록된 고객이 없습니다.</p>
            <Link to="/customers/new">
              <Button className="w-full">신규 고객 등록</Button>
            </Link>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentCustomers.map((c) => (
              <li key={c.id}>
                <Link to={`/customers/${c.id}`}>
                  <Card className="transition hover:border-klar-300 hover:shadow-lift">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-klar-900">{c.name}</p>
                        <p className="mt-1 text-xs text-klar-500">{c.phone || '연락처 미입력'}</p>
                      </div>
                      <span className="rounded-full bg-pearl-100 px-2.5 py-1 text-[11px] font-medium text-pearl-500">
                        상세
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
