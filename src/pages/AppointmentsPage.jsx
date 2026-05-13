import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  APPOINTMENT_COURSE_MAP,
} from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { isoDateOnly } from '../lib/format.js'
import { Button, Card, PageHeader } from '../components/Ui.jsx'

export function AppointmentsPage() {
  const { state } = useAppData()
  const [date, setDate] = useState(() => isoDateOnly())

  const list = useMemo(() => {
    return state.appointments
      .filter((a) => a.date === date)
      .slice()
      .sort((a, b) =>
        String(a.time || '').localeCompare(String(b.time || '')),
      )
  }, [date, state.appointments])

  return (
    <div>
      <PageHeader
        title="예약 관리"
        subtitle={`${date} 일정`}
        right={
          <Link to={`/appointments/new?date=${encodeURIComponent(date)}`}>
            <Button className="px-4 py-2 text-xs shadow-lg shadow-klar-900/10">
              등록
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-dashed border-klar-200 bg-white px-3 py-2">
        <label className="flex flex-1 items-center gap-2 text-xs font-semibold text-slate-600">
          조회 일자
          <input
            type="date"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-klar-400"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <Button
          variant="ghost"
          type="button"
          className="shrink-0 px-3 py-2 text-[11px]"
          onClick={() => setDate(isoDateOnly())}
        >
          오늘
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="border-dashed bg-slate-50 py-14 text-center text-sm text-slate-600">
          이 날짜에는 예약이 없습니다.
          <div className="mt-6">
            <Link to={`/appointments/new?date=${encodeURIComponent(date)}`}>
              <Button>예약 만들기</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((a) => {
            const customer = state.customers.find((c) => c.id === a.customerId)
            return (
              <li key={a.id}>
                <Link to={`/appointments/${a.id}/edit`}>
                  <Card className="group transition hover:border-klar-200 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {(a.time || '').slice(0, 5) || '시간 미정'}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {customer?.name ?? '고객 미지정'}
                        </p>
                        <p className="mt-1 text-xs text-klar-900">
                          {APPOINTMENT_COURSE_MAP[a.course] ?? a.course}
                        </p>
                        {a.note ? (
                          <p className="mt-2 line-clamp-2 text-xs text-slate-500">{a.note}</p>
                        ) : null}
                      </div>
                      <svg
                        className="mt-1 h-5 w-5 text-slate-300 group-hover:text-klar-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
