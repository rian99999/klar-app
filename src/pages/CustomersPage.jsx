import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import { groupByInitial } from '../lib/hangul.js'
import { phoneDigits } from '../lib/format.js'
import { Icon } from '../components/Icon.jsx'
import {
  Badge,
  Button,
  CardLink,
  EmptyState,
  PageHeader,
  SearchInput,
  SegmentedControl,
  SkeletonList,
} from '../components/Ui.jsx'

const SORT_OPTIONS = [
  { value: 'name', label: '이름순' },
  { value: 'recent', label: '최근순' },
]

export function CustomersPage() {
  const { state, ready } = useAppData()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('name')

  /** Record counts per customer, so the list row can show activity at a glance. */
  const recordCount = useMemo(() => {
    const counts = new Map()
    const bump = (id) => counts.set(id, (counts.get(id) ?? 0) + 1)
    state.personalColorSessions.forEach((s) => bump(s.customerId))
    state.makeupConsultSessions.forEach((s) => bump(s.customerId))
    return counts
  }, [state.personalColorSessions, state.makeupConsultSessions])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = [...state.customers].sort((a, b) =>
      sort === 'recent'
        ? String(b.updatedAt).localeCompare(String(a.updatedAt))
        : String(a.name).localeCompare(String(b.name), 'ko'),
    )
    if (!term) return list
    const termDigits = phoneDigits(term)
    return list.filter(
      (c) =>
        String(c.name).toLowerCase().includes(term) ||
        (termDigits && phoneDigits(c.phone).includes(termDigits)),
    )
  }, [query, sort, state.customers])

  /** Alphabetical sections only make sense when the list is name-ordered. */
  const sections = useMemo(
    () => (sort === 'name' ? groupByInitial(filtered) : [{ letter: null, items: filtered }]),
    [filtered, sort],
  )

  return (
    <div>
      <PageHeader
        title="고객 관리"
        subtitle={`등록 고객 ${state.customers.length}명`}
        right={
          <Link to="/customers/new">
            <Button size="sm" icon="plus">
              신규
            </Button>
          </Link>
        }
      />

      <div className="mb-5 space-y-3">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          placeholder="이름 또는 연락처 검색"
          aria-label="고객 검색"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-ink-muted" role="status">
            {query ? `검색 결과 ${filtered.length}명` : `전체 ${filtered.length}명`}
          </p>
          <SegmentedControl
            ariaLabel="정렬 기준"
            className="w-[11rem]"
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
          />
        </div>
      </div>

      {!ready && state.customers.length === 0 ? (
        <SkeletonList rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={query ? 'search' : 'users'}
          title={query ? '검색 결과가 없습니다' : '아직 등록된 고객이 없습니다'}
          description={
            query
              ? '이름 일부나 연락처 숫자로 다시 검색해 보세요.'
              : '첫 고객을 등록하면 퍼스널컬러 · 메이크업 기록을 이어서 남길 수 있어요.'
          }
          action={
            query ? (
              <Button variant="secondary" className="w-full" onClick={() => setQuery('')}>
                검색 초기화
              </Button>
            ) : (
              <Link to="/customers/new">
                <Button className="w-full" icon="plus">
                  신규 고객 등록
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-5">
          {sections.map((section, index) => (
            <section key={section.letter ?? index}>
              {section.letter ? (
                <h2 className="sticky top-[4.75rem] z-10 -mx-1 mb-2 px-1 py-1 text-xs font-bold text-klar-500 backdrop-blur-sm">
                  {section.letter}
                </h2>
              ) : null}
              <ul className="flex flex-col gap-2">
                {section.items.map((customer) => {
                  const count = recordCount.get(customer.id) ?? 0
                  return (
                    <li key={customer.id}>
                      <Link to={`/customers/${customer.id}`} className="block">
                        <CardLink>
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-klar-100 to-pearl-100 text-[15px] font-semibold text-klar-700">
                              {String(customer.name ?? '?').trim().charAt(0) || '?'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-semibold text-ink">
                                {customer.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-ink-muted">
                                {customer.phone || '연락처 없음'}
                              </p>
                            </div>
                            {count > 0 ? (
                              <Badge tone="brand">기록 {count}</Badge>
                            ) : (
                              <Badge>기록 없음</Badge>
                            )}
                            <Icon name="chevronRight" className="h-4 w-4 text-ink-faint" />
                          </div>
                        </CardLink>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
