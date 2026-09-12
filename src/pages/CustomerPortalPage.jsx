import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PERSONAL_TYPE_MAP } from '../data/constants.js'
import { ProductCatalog } from '../components/ProductCatalog.jsx'
import { toneBadgeVariant } from '../lib/product.js'
import { formatDateKo, phoneDigits } from '../lib/format.js'
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

function AuthCard({ customerId, onAuthorized }) {
  const [name, setName] = useState('')
  const [lastDigits, setLastDigits] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const response = await fetch(`/api/portal/${encodeURIComponent(customerId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lastDigits }),
      })
      const payload = await response.json().catch(() => ({}))
      if (response.ok && payload?.data) {
        onAuthorized(payload.data)
        return
      }
      setError(
        response.status === 429
          ? `시도가 너무 많습니다. ${payload?.retryAfterSec ?? 60}초 후 다시 시도해 주세요.`
          : '이름 또는 연락처 뒷자리가 일치하지 않습니다.',
      )
    } catch {
      setError('연결에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
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
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? '확인 중…' : '내 결과지 보기'}
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
  const [data, setData] = useState(null)

  if (!data) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-lg px-4 py-8">
        <AuthCard customerId={customerId} onAuthorized={setData} />
      </main>
    )
  }

  const {
    customer,
    personalColorSessions,
    makeupConsultSessions,
    toneRecommendProducts,
    productCategoryVisibility,
  } = data

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-lg px-4 py-8">
      <div className="animate-fade-up space-y-7 pb-14">
        <section className="overflow-hidden rounded-xl border border-line bg-white/85 shadow-card">
          <div className="bg-gradient-to-br from-klar-100 via-klar-50 to-pearl-50 px-5 pb-6 pt-7">
            <p className="brand-kicker">KLAR Result</p>
            <h1 className="brand-title mt-2.5 text-3xl leading-tight">
              {customer.name}님 결과지
            </h1>
            <p className="mt-2.5 text-sm text-ink-muted">
              ***-****-{customer.phoneLast4}
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-line border-t border-line bg-white/80">
            <StatTile label="Personal" value={personalColorSessions.length} suffix="회" />
            <StatTile label="Makeup" value={makeupConsultSessions.length} suffix="회" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="brand-title text-xl">퍼스널컬러 결과</h2>
          {personalColorSessions.length === 0 ? (
            <EmptyState
              icon="sparkle"
              title="등록된 퍼스널컬러 결과지가 없습니다"
              description="진단 후 담당 컨설턴트가 결과지를 등록하면 여기에 표시됩니다."
            />
          ) : (
            personalColorSessions.map((session) => (
              <PersonalResultCard
                key={session.id}
                session={session}
                products={toneRecommendProducts}
                visibility={productCategoryVisibility}
              />
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="brand-title text-xl">메이크업 자료</h2>
          {makeupConsultSessions.length === 0 ? (
            <EmptyState
              icon="lipstick"
              title="등록된 메이크업 컨설팅 기록이 없습니다"
              description="컨설팅 당일 사용한 제품이 등록되면 여기에서 확인할 수 있어요."
            />
          ) : (
            makeupConsultSessions.map((session) => (
              <MakeupSessionCard key={session.id} session={session} />
            ))
          )}
        </section>

        <footer className="pt-2 text-center">
          <Wordmark className="text-2xl text-klar-400" />
          <p className="brand-kicker mt-2">빛나는 당신을 위해</p>
        </footer>
      </div>
    </main>
  )
}
