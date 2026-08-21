import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PERSONAL_TYPE_MAP } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { ProductCatalog } from '../components/ProductCatalog.jsx'
import { toneBadgeVariant } from '../lib/product.js'
import { formatDateKo, maskPhone, phoneDigits } from '../lib/format.js'
import { Icon, Wordmark } from '../components/Icon.jsx'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  StatTile,
} from '../components/Ui.jsx'

function normalizeName(value) {
  return String(value ?? '').replace(/\s/g, '').toLowerCase()
}

function AuthCard({ customer, onAuthorized }) {
  const [name, setName] = useState('')
  const [lastDigits, setLastDigits] = useState('')
  const [error, setError] = useState('')
  const expectedLast4 = phoneDigits(customer.phone).slice(-4)

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
    <div className="flex min-h-[80dvh] flex-col justify-center">
      <div className="mb-7 text-center">
        <Wordmark className="text-5xl text-klar-700" />
        <p className="brand-kicker mt-3">Color &amp; Makeup</p>
      </div>

      <Card className="space-y-6 p-5">
        <div>
          <h1 className="brand-title text-2xl">결과지 확인</h1>
          <p className="mt-2.5 text-sm leading-6 text-ink-muted">
            본인 확인을 위해 예약 시 등록한 이름과 연락처 뒷 4자리를 입력해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="이름">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError('')
              }}
              placeholder="예: 홍길동"
              autoComplete="name"
              required
            />
          </Field>
          <Field label="연락처 뒷 4자리" error={error || undefined}>
            <Input
              value={lastDigits}
              onChange={(e) => {
                setLastDigits(phoneDigits(e.target.value).slice(0, 4))
                if (error) setError('')
              }}
              placeholder="1234"
              inputMode="numeric"
              maxLength={4}
              className="tracking-[0.4em]"
              required
            />
          </Field>
          <Button type="submit" size="lg" className="w-full">
            내 결과지 보기
          </Button>
        </form>
      </Card>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-faint">
        <Icon name="shield" className="h-3.5 w-3.5" />
        입력하신 정보는 본인 확인에만 사용됩니다.
      </p>
    </div>
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
    <Card className="space-y-5 p-5">
      <header>
        <p className="text-xs font-semibold text-klar-500">
          {formatDateKo(session.dateISO)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h3 className="brand-title text-xl">{primaryLabel}</h3>
          <Badge tone={toneBadgeVariant(session.primaryTypeKey)}>
            {session.tone === 'warm' ? '웜톤' : '쿨톤'}
          </Badge>
        </div>
        {secondaryLabel ? (
          <p className="mt-1.5 text-xs text-ink-muted">보조 타입 · {secondaryLabel}</p>
        ) : null}
      </header>

      <div className="rounded-md bg-klar-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-klar-500">
          진단 메모
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-soft">
          {session.memo || '등록된 진단 메모가 없습니다.'}
        </p>
      </div>

      <section>
        <div className="mb-3">
          <p className="text-[15px] font-semibold text-ink">맞춤 추천 제품</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            결과 톤에 맞는 제품만 표시됩니다. 카테고리 탭으로 더 좁혀볼 수 있어요.
          </p>
        </div>
        <ProductCatalog
          products={products}
          categoryVisibility={visibility}
          toneKeys={toneKeys}
          emptyMessage="이 결과 톤에 맞는 추천 제품이 아직 없습니다"
        />
      </section>
    </Card>
  )
}

function MakeupSessionCard({ session }) {
  return (
    <Card className="space-y-4 p-5">
      <header>
        <p className="text-xs font-semibold text-klar-500">
          {formatDateKo(session.dateISO)}
        </p>
        <h3 className="brand-title mt-1.5 text-xl">메이크업 컨설팅</h3>
      </header>

      {session.memo ? (
        <div className="rounded-md bg-klar-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-klar-500">
            컨설팅 메모
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-soft">
            {session.memo}
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-line">
        {(session.products ?? []).length === 0 ? (
          <p className="px-4 py-5 text-sm text-ink-muted">등록된 사용 제품이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {session.products.map((product, index) => (
              <li key={product.lineId ?? index} className="flex gap-3 px-4 py-3.5">
                <Badge className="mt-0.5 shrink-0">{product.category}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {product.productName || '제품명 미입력'}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {[product.brand, product.shade].filter(Boolean).join(' · ') ||
                      '브랜드/색상 미입력'}
                  </p>
                  {product.memo ? (
                    <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-ink-muted">
                      {product.memo}
                    </p>
                  ) : null}
                </div>
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
        <Card className="w-full space-y-3 p-6 text-center">
          <h1 className="brand-title text-2xl">결과지를 찾을 수 없습니다</h1>
          <p className="text-sm leading-6 text-ink-muted">
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
        <div className="animate-fade-up space-y-7 pb-14">
          <section className="overflow-hidden rounded-xl border border-line bg-white/85 shadow-card">
            <div className="bg-gradient-to-br from-klar-100 via-klar-50 to-pearl-50 px-5 pb-6 pt-7">
              <p className="brand-kicker">KLAR Result</p>
              <h1 className="brand-title mt-2.5 text-3xl leading-tight">
                {customer.name}님 결과지
              </h1>
              <p className="mt-2.5 text-sm text-ink-muted">{maskPhone(customer.phone)}</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-line border-t border-line bg-white/80">
              <StatTile label="Personal" value={personalSessions.length} suffix="회" />
              <StatTile label="Makeup" value={makeupSessions.length} suffix="회" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="brand-title text-xl">퍼스널컬러 결과</h2>
            {personalSessions.length === 0 ? (
              <EmptyState
                icon="sparkle"
                title="등록된 퍼스널컬러 결과지가 없습니다"
                description="진단 후 담당 컨설턴트가 결과지를 등록하면 여기에 표시됩니다."
              />
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
            <h2 className="brand-title text-xl">메이크업 자료</h2>
            {makeupSessions.length === 0 ? (
              <EmptyState
                icon="lipstick"
                title="등록된 메이크업 컨설팅 기록이 없습니다"
                description="컨설팅 당일 사용한 제품이 등록되면 여기에서 확인할 수 있어요."
              />
            ) : (
              makeupSessions.map((session) => (
                <MakeupSessionCard key={session.id} session={session} />
              ))
            )}
          </section>

          <Link to="/makeup">
            <Button variant="secondary" className="w-full" size="lg">
              전체 추천 제품 보기
            </Button>
          </Link>

          <footer className="pt-2 text-center">
            <Wordmark className="text-2xl text-klar-400" />
            <p className="brand-kicker mt-2">빛나는 당신을 위해</p>
          </footer>
        </div>
      )}
    </main>
  )
}
