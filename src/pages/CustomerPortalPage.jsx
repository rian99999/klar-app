import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PERSONAL_TYPE_MAP } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { ProductCatalog } from '../components/ProductCatalog.jsx'
import { Button, Card, Field, Input } from '../components/Ui.jsx'
import { formatDateKo } from '../lib/format.js'

function phoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function phoneLast4(value) {
  return phoneDigits(value).slice(-4)
}

function maskPhone(value) {
  const digits = phoneDigits(value)
  if (digits.length < 4) return '연락처 미등록'
  return `***-****-${digits.slice(-4)}`
}

function normalizeName(value) {
  return String(value ?? '').replace(/\s/g, '').toLowerCase()
}

function AuthCard({ customer, onAuthorized }) {
  const [name, setName] = useState('')
  const [lastDigits, setLastDigits] = useState('')
  const [error, setError] = useState('')
  const expectedLast4 = phoneLast4(customer.phone)

  function handleSubmit(e) {
    e.preventDefault()
    if (!expectedLast4) {
      setError('등록된 연락처가 없어 본인 확인을 진행할 수 없습니다.')
      return
    }
    const nameMatches = normalizeName(name) === normalizeName(customer.name)
    const phoneMatches = phoneDigits(lastDigits).slice(-4) === expectedLast4
    if (!nameMatches || !phoneMatches) {
      setError('이름 또는 연락처 뒷자리가 일치하지 않습니다.')
      return
    }
    setError('')
    onAuthorized()
  }

  return (
    <Card className="space-y-5">
      <div>
        <p className="brand-kicker">Result Access</p>
        <h1 className="brand-title mt-2 text-3xl">결과지 확인</h1>
        <p className="mt-3 text-sm leading-6 text-klar-600">
          본인 확인을 위해 예약 시 등록한 이름과 연락처 뒷 4자리를 입력해 주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="이름">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 홍길동"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="연락처 뒷 4자리">
          <Input
            value={lastDigits}
            onChange={(e) => setLastDigits(phoneDigits(e.target.value).slice(0, 4))}
            placeholder="1234"
            inputMode="numeric"
            maxLength={4}
            required
          />
        </Field>
        {error ? <p className="text-xs font-medium text-rose-700">{error}</p> : null}
        <Button type="submit" className="w-full">
          내 결과지 보기
        </Button>
      </form>
    </Card>
  )
}

function PersonalResultCard({ session, products, visibility }) {
  const primaryLabel =
    PERSONAL_TYPE_MAP[session.primaryTypeKey]?.label ?? session.primaryTypeKey
  const secondaryLabel = session.secondaryTypeKey
    ? PERSONAL_TYPE_MAP[session.secondaryTypeKey]?.label ?? session.secondaryTypeKey
    : null
  const toneKeys = [session.primaryTypeKey, session.secondaryTypeKey].filter(Boolean)

  return (
    <Card className="space-y-4">
      <header>
        <p className="text-xs font-semibold text-klar-600">
          {formatDateKo(session.dateISO)}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-klar-900">
          {session.tone === 'warm' ? '웜톤' : '쿨톤'} · {primaryLabel}
        </h3>
        {secondaryLabel ? (
          <p className="mt-1 text-xs text-klar-500">보조 타입 · {secondaryLabel}</p>
        ) : null}
      </header>

      <div className="rounded-[12px] bg-klar-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-klar-500">
          진단 메모
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-klar-800">
          {session.memo || '등록된 진단 메모가 없습니다.'}
        </p>
      </div>

      <section>
        <div className="mb-3">
          <p className="text-sm font-semibold text-klar-900">맞춤 추천 제품</p>
          <p className="mt-1 text-[11px] leading-5 text-klar-500">
            결과 톤에 맞는 제품만 표시됩니다. 카테고리 탭으로 더 좁혀볼 수 있어요.
          </p>
        </div>
        <ProductCatalog
          products={products}
          categoryVisibility={visibility}
          toneKeys={toneKeys}
          emptyMessage="이 결과 톤에 맞는 추천 제품이 아직 없습니다."
        />
      </section>
    </Card>
  )
}

function MakeupSessionCard({ session }) {
  return (
    <Card className="space-y-4">
      <header>
        <p className="text-xs font-semibold text-klar-600">
          {formatDateKo(session.dateISO)}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-klar-900">
          메이크업 컨설팅 기록
        </h3>
      </header>

      {session.memo ? (
        <div className="rounded-[12px] bg-klar-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-klar-500">
            컨설팅 메모
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-klar-800">
            {session.memo}
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[12px] border border-klar-100 bg-white">
        {(session.products ?? []).length === 0 ? (
          <p className="px-4 py-5 text-sm text-klar-500">등록된 사용 제품이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-klar-100">
            {session.products.map((product, index) => (
              <li key={product.lineId ?? index} className="px-4 py-3">
                <p className="text-xs font-semibold text-klar-500">
                  {product.category}
                </p>
                <p className="mt-1 text-sm font-semibold text-klar-900">
                  {product.productName || '제품명 미입력'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {[product.brand, product.shade].filter(Boolean).join(' · ') ||
                    '브랜드/색상 미입력'}
                </p>
                {product.memo ? (
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                    {product.memo}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

export function CustomerPortalPage() {
  const { customerId } = useParams()
  const { state } = useAppData()
  const [authorized, setAuthorized] = useState(false)

  const customer = state.customers.find((item) => item.id === customerId)

  const personalSessions = useMemo(
    () =>
      state.personalColorSessions
        .filter((session) => session.customerId === customerId)
        .slice()
        .sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO))),
    [customerId, state.personalColorSessions],
  )

  const makeupSessions = useMemo(
    () =>
      state.makeupConsultSessions
        .filter((session) => session.customerId === customerId)
        .slice()
        .sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO))),
    [customerId, state.makeupConsultSessions],
  )

  if (!customer) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg items-center px-4 py-10">
        <Card className="w-full space-y-4 text-center">
          <h1 className="brand-title text-2xl">결과지를 찾을 수 없습니다</h1>
          <p className="text-sm leading-6 text-klar-500">
            링크가 올바른지 다시 확인해 주세요.
          </p>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-lg px-4 py-8">
      {!authorized ? (
        <AuthCard customer={customer} onAuthorized={() => setAuthorized(true)} />
      ) : (
        <div className="space-y-7 pb-12">
          <section className="overflow-hidden rounded-[18px] border border-klar-200 bg-white/85 shadow-card">
            <div className="bg-klar-100 px-5 pb-5 pt-6">
              <p className="brand-kicker">KLAR Result</p>
              <h1 className="brand-title mt-2 text-4xl">
                {customer.name}님 결과지
              </h1>
              <p className="mt-3 text-sm text-klar-600">{maskPhone(customer.phone)}</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-klar-100 border-t border-klar-100 bg-white/80">
              <div className="px-4 py-3">
                <p className="brand-kicker">Personal</p>
                <p className="mt-1 text-xl font-semibold text-klar-900">
                  {personalSessions.length}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="brand-kicker">Makeup</p>
                <p className="mt-1 text-xl font-semibold text-klar-900">
                  {makeupSessions.length}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="brand-title text-2xl">퍼스널컬러 결과</h2>
            {personalSessions.length === 0 ? (
              <Card className="border-dashed py-8 text-center text-sm text-klar-500">
                등록된 퍼스널컬러 결과지가 없습니다.
              </Card>
            ) : (
              personalSessions.map((session) => (
                <PersonalResultCard
                  key={session.id}
                  session={session}
                  products={state.toneRecommendProducts}
                  visibility={state.productCategoryVisibility}
                />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="brand-title text-2xl">메이크업 자료</h2>
            {makeupSessions.length === 0 ? (
              <Card className="border-dashed py-8 text-center text-sm text-klar-500">
                등록된 메이크업 컨설팅 기록이 없습니다.
              </Card>
            ) : (
              makeupSessions.map((session) => (
                <MakeupSessionCard key={session.id} session={session} />
              ))
            )}
          </section>

          <Link to="/makeup">
            <Button variant="secondary" className="w-full">
              전체 추천 제품 보기
            </Button>
          </Link>
        </div>
      )}
    </main>
  )
}
