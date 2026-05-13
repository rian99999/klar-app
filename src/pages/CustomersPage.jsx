import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import { Button, Card, Input, PageHeader } from '../components/Ui.jsx'

export function CustomersPage() {
  const { state } = useAppData()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = [...state.customers].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'ko'),
    )
    if (!t) return list
    return list.filter(
      (c) =>
        String(c.name).toLowerCase().includes(t) ||
        String(c.phone).replace(/\s/g, '').includes(t.replace(/\s/g, '')),
    )
  }, [q, state.customers])

  return (
    <div>
      <PageHeader
        title="고객 관리"
        subtitle={`총 ${state.customers.length}명`}
        right={
          <Link to="/customers/new">
            <Button className="px-3 text-xs shadow-md shadow-klar-900/10">
              신규
            </Button>
          </Link>
        }
      />

      <div className="mb-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름 또는 연락처 검색"
          aria-label="고객 검색"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed bg-white py-12 text-center text-sm text-slate-500">
          {state.customers.length === 0
            ? '첫 고객을 등록해 보세요.'
            : '검색 결과가 없습니다.'}
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link to={`/customers/${c.id}`}>
                <Card className="transition hover:border-klar-200 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {c.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {c.phone || '연락처 없음'}
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 shrink-0 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
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
          ))}
        </ul>
      )}
    </div>
  )
}
