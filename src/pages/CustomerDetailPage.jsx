import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PERSONAL_TYPE_MAP } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { formatDateKo, formatPhone, phoneDigits } from '../lib/format.js'
import { toneBadgeVariant } from '../lib/product.js'
import { ProductCatalog } from '../components/ProductCatalog.jsx'
import { SessionProductList } from '../components/SessionProductList.jsx'
import { Icon } from '../components/Icon.jsx'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Disclosure,
  EmptyState,
  Field,
  Input,
  NoteBlock,
  PageHeader,
  SectionHeader,
  StatTile,
  Textarea,
} from '../components/Ui.jsx'

function ContactActions({ customer }) {
  const digits = phoneDigits(customer.phone)
  if (!digits) return null
  return (
    <div className="grid grid-cols-2 gap-2">
      <a href={`tel:${digits}`} className="block">
        <Button variant="secondary" className="w-full" icon="phone">
          전화
        </Button>
      </a>
      <a href={`sms:${digits}`} className="block">
        <Button variant="secondary" className="w-full" icon="message">
          문자
        </Button>
      </a>
    </div>
  )
}

function CustomerBasicsEditor({ customer, onSave }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [memo, setMemo] = useState(customer.memo ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      memo: memo.trim(),
    })
    setOpen(false)
  }

  return (
    <Disclosure
      open={open}
      onToggle={() => setOpen((v) => !v)}
      title="기본 정보"
      aside={customer.memo}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="이름">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="연락처">
          <Input
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            inputMode="tel"
          />
        </Field>
        <Field label="이메일">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="메모">
          <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full">
          기본 정보 저장
        </Button>
      </form>
    </Disclosure>
  )
}

/** iOS expects `sms:번호&body=`, Android `sms:번호?body=`. */
function smsSeparator() {
  if (typeof navigator === 'undefined') return '?'
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? '&' : '?'
}

function ResultShareCard({ customer }) {
  const { toast } = useToast()
  const resultPath = `/result/${customer.id}`
  const resultUrl =
    typeof window === 'undefined'
      ? resultPath
      : `${window.location.origin}${resultPath}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(resultUrl)
      toast('결과지 링크를 복사했습니다.')
    } catch {
      window.prompt('결과지 확인 링크를 복사해 주세요.', resultUrl)
    }
  }

  /**
   * 휴대폰의 공유 시트(문자·카카오톡 등)를 엽니다.
   * 공유 시트가 없는 브라우저에서는 문자 앱, 그것도 없으면 링크 복사로 넘어갑니다.
   */
  async function shareLink() {
    const message = `[KLAR] ${customer.name}님 결과지입니다. ${resultUrl}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${customer.name}님 KLAR 결과지`,
          text: `${customer.name}님, KLAR 진단 결과지입니다. 이름과 연락처 뒷 4자리를 입력하면 열람하실 수 있어요.`,
          url: resultUrl,
        })
        return
      } catch (error) {
        // 사용자가 공유창을 닫은 경우는 알림 없이 넘어갑니다.
        if (error?.name === 'AbortError') return
      }
    }
    const digits = phoneDigits(customer.phone)
    if (digits) {
      window.location.href = `sms:${digits}${smsSeparator()}body=${encodeURIComponent(message)}`
      return
    }
    copyLink()
  }

  return (
    <Card className="space-y-3.5 border-klar-200 bg-gradient-to-br from-white via-klar-50 to-pearl-50">
      <div>
        <p className="brand-kicker">Client Link</p>
        <h2 className="brand-title mt-1 text-lg">고객 결과지 링크</h2>
        <p className="mt-1.5 text-xs leading-5 text-ink-muted">
          고객이 이름과 연락처 뒷 4자리를 입력하면 본인 자료만 볼 수 있습니다.
        </p>
      </div>

      <p className="break-all rounded-md border border-line bg-white/85 px-3 py-2.5 font-mono text-[11px] leading-5 text-ink-soft">
        {resultUrl}
      </p>

      {!customer.phone ? (
        <p className="flex items-start gap-1.5 rounded-md bg-amber-50 px-3 py-2.5 text-xs font-medium leading-5 text-amber-700">
          <Icon name="shield" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          연락처가 없어 본인 확인이 불가능합니다. 연락처를 먼저 저장해 주세요.
        </p>
      ) : null}

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={shareLink} icon="message">
            공유하기
          </Button>
          <Button variant="secondary" onClick={copyLink} icon="link">
            링크 복사
          </Button>
        </div>
        <Link to={resultPath} className="block">
          <Button variant="ghost" className="w-full">
            고객 화면 미리보기
          </Button>
        </Link>
      </div>
    </Card>
  )
}

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useAppData()
  const { toast } = useToast()

  const customer = state.customers.find((c) => c.id === customerId)

  const personalSessions = useMemo(
    () =>
      state.personalColorSessions
        .filter((p) => p.customerId === customerId)
        .slice()
        .sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO))),
    [state.personalColorSessions, customerId],
  )

  const makeupSessions = useMemo(
    () =>
      state.makeupConsultSessions
        .filter((m) => m.customerId === customerId)
        .slice()
        .sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO))),
    [state.makeupConsultSessions, customerId],
  )

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return state.appointments
      .filter((a) => a.customerId === customerId && a.date >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0]
  }, [state.appointments, customerId])

  const [openPersonalId, setOpenPersonalId] = useState(null)
  const [openMakeupId, setOpenMakeupId] = useState(null)

  if (!customer) {
    return (
      <div>
        <PageHeader title="고객을 찾을 수 없습니다" back="/customers" />
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          고객 목록으로
        </Button>
      </div>
    )
  }

  function removeCustomer() {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('고객과 연결된 기록까지 모두 삭제됩니다. 계속할까요?')
    ) {
      return
    }
    actions.deleteCustomer(customer.id)
    toast('고객과 관련 기록을 삭제했습니다.', { tone: 'info' })
    navigate('/customers', { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Client"
        title={customer.name}
        subtitle={customer.phone || '연락처 미입력'}
        back="/customers"
        right={<Avatar name={customer.name} size="lg" />}
      />

      <ContactActions customer={customer} />

      <div className="grid grid-cols-2 divide-x divide-line overflow-hidden rounded-lg border border-line bg-white/85 shadow-card">
        <StatTile label="퍼스널컬러" value={personalSessions.length} suffix="회" />
        <StatTile label="메이크업" value={makeupSessions.length} suffix="회" />
      </div>

      {upcoming ? (
        <Link to={`/appointments/${upcoming.id}/edit`} className="block">
          <Card className="flex items-center gap-3 border-klar-200 bg-klar-50/70 transition hover:border-klar-300">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-klar-600">
              <Icon name="calendar" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-klar-500">다음 예약</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-ink">
                {formatDateKo(`${upcoming.date}T12:00:00`)}
                {upcoming.time ? ` · ${upcoming.time.slice(0, 5)}` : ''}
              </p>
            </div>
            <Icon name="chevronRight" className="h-4 w-4 text-ink-faint" />
          </Card>
        </Link>
      ) : null}

      <CustomerBasicsEditor
        key={customer.updatedAt}
        customer={customer}
        onSave={(payload) => {
          actions.upsertCustomer({ id: customer.id, ...payload })
          toast('기본 정보를 저장했습니다.')
        }}
      />

      <ResultShareCard customer={customer} />

      {/* 퍼스널컬러 */}
      <section>
        <SectionHeader
          kicker="Personal Color"
          title="퍼스널컬러 진단"
          count={personalSessions.length || undefined}
          action={
            <Link to={`/customers/${customer.id}/personal/new`}>
              <Button variant="secondary" size="sm" icon="plus">
                새 결과지
              </Button>
            </Link>
          }
        />
        {personalSessions.length === 0 ? (
          <EmptyState
            icon="sparkle"
            title="등록된 결과지가 없습니다"
            description="진단을 마치면 결과지를 남겨 고객에게 링크로 공유할 수 있어요."
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {personalSessions.map((session) => {
              const primary =
                PERSONAL_TYPE_MAP[session.primaryTypeKey]?.label ?? session.primaryTypeKey
              const secondary = session.secondaryTypeKey
                ? PERSONAL_TYPE_MAP[session.secondaryTypeKey]?.label ??
                  session.secondaryTypeKey
                : null
              return (
                <li key={session.id}>
                  <Disclosure
                    open={openPersonalId === session.id}
                    onToggle={() =>
                      setOpenPersonalId((cur) => (cur === session.id ? null : session.id))
                    }
                    kicker={formatDateKo(session.dateISO)}
                    title={primary}
                    badge={
                      <Badge tone={toneBadgeVariant(session.primaryTypeKey)}>
                        {session.tone === 'warm' ? '웜톤' : '쿨톤'}
                      </Badge>
                    }
                  >
                    {secondary ? (
                      <p className="text-xs text-ink-muted">보조 타입 · {secondary}</p>
                    ) : null}
                    <NoteBlock label="특이사항 · 메모">
                      {session.memo || '기록 없음'}
                    </NoteBlock>
                    <div className="rounded-md border border-line bg-white p-3">
                      <p className="mb-3 text-[13px] font-semibold text-ink">
                        결과 톤 맞춤 추천 제품
                      </p>
                      <ProductCatalog
                        products={state.toneRecommendProducts}
                        categoryVisibility={state.productCategoryVisibility}
                        toneKeys={[
                          session.primaryTypeKey,
                          session.secondaryTypeKey,
                        ].filter(Boolean)}
                        emptyMessage="이 결과 톤에 맞는 노출 제품이 아직 없습니다"
                      />
                    </div>
                    <Link to={`/customers/${customer.id}/personal/${session.id}`}>
                      <Button variant="secondary" className="w-full">
                        결과지 수정
                      </Button>
                    </Link>
                  </Disclosure>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 메이크업 */}
      <section>
        <SectionHeader
          kicker="Makeup"
          title="메이크업 컨설팅"
          count={makeupSessions.length || undefined}
          action={
            <Link to={`/customers/${customer.id}/consult/new`}>
              <Button variant="secondary" size="sm" icon="plus">
                새 기록
              </Button>
            </Link>
          }
        />
        {makeupSessions.length === 0 ? (
          <EmptyState
            icon="lipstick"
            title="등록된 컨설팅 기록이 없습니다"
            description="당일 사용한 제품을 남겨 두면 다음 방문 때 그대로 이어갈 수 있어요."
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {makeupSessions.map((session) => (
              <li key={session.id}>
                <Disclosure
                  open={openMakeupId === session.id}
                  onToggle={() =>
                    setOpenMakeupId((cur) => (cur === session.id ? null : session.id))
                  }
                  kicker={formatDateKo(session.dateISO)}
                  title={`사용 제품 ${session.products?.length ?? 0}개`}
                >
                  {session.memo ? (
                    <NoteBlock label="세션 메모">{session.memo}</NoteBlock>
                  ) : null}
                  <SessionProductList
                    products={session.products ?? []}
                    emptyMessage="등록된 제품이 없습니다."
                  />
                  <Link to={`/customers/${customer.id}/consult/${session.id}`}>
                    <Button variant="secondary" className="w-full">
                      기록 수정
                    </Button>
                  </Link>
                </Disclosure>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button variant="dangerQuiet" className="w-full" icon="trash" onClick={removeCustomer}>
        고객 삭제 (관련 데이터 모두 삭제)
      </Button>
    </div>
  )
}
