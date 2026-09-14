import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import { groupByInitial } from '../lib/hangul.js'
import { phoneDigits } from '../lib/format.js'
import { CustomerCard, RecordCountBadge } from '../components/CustomerCard.jsx'
import {
  Button,
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
                {section.items.map((customer) => (
                  <li key={customer.id}>
                    <CustomerCard
                      customer={customer}
                      trailing={<RecordCountBadge count={recordCount.get(customer.id) ?? 0} />}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
