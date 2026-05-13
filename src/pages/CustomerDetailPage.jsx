import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  PERSONAL_TYPE_MAP,
} from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { formatDateKo } from '../lib/format.js'
import { ProductCatalog } from '../components/ProductCatalog.jsx'
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Textarea,
} from '../components/Ui.jsx'

function CustomerBasicsEditor({ customer, onSave }) {
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
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-3">
      <Card className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-klar-800">
          기본 정보
        </h2>
        <Field label="이름">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="연락처">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="이메일">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
            메모
          </label>
          <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            기본 정보 저장
          </Button>
        </div>
      </Card>
    </form>
  )
}

function ResultShareCard({ customer }) {
  const [copied, setCopied] = useState(false)
  const resultPath = `/result/${customer.id}`
  const resultUrl =
    typeof window === 'undefined'
      ? resultPath
      : `${window.location.origin}${resultPath}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(resultUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt('결과지 확인 링크를 복사해 주세요.', resultUrl)
    }
  }

  return (
    <Card className="mb-6 space-y-3 border-klar-100 bg-gradient-to-br from-white to-klar-50">
      <div>
        <p className="brand-kicker">Client Link</p>
        <h2 className="brand-title mt-1 text-xl">고객 결과지 확인 링크</h2>
        <p className="mt-2 text-xs leading-5 text-klar-500">
          고객은 이 링크에서 이름과 연락처 뒷 4자리를 입력하면 본인 자료만 볼 수 있습니다.
        </p>
      </div>
      <div className="rounded-[10px] border border-klar-100 bg-white/85 px-3 py-2 text-xs text-klar-700 break-all">
        {resultUrl}
      </div>
      {!customer.phone ? (
        <p className="text-xs font-medium text-rose-700">
          연락처가 없어 고객 본인 확인이 불가능합니다. 연락처를 먼저 저장해 주세요.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={copyLink}>
          {copied ? '복사 완료' : '링크 복사'}
        </Button>
        <Link to={resultPath}>
          <Button type="button" className="w-full">
            미리보기
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

  const customer = state.customers.find((c) => c.id === customerId)

  const personalSessions = useMemo(() => {
    return state.personalColorSessions
      .filter((p) => p.customerId === customerId)
      .slice()
      .sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO)))
  }, [state.personalColorSessions, customerId])

  const makeupSessions = useMemo(() => {
    return state.makeupConsultSessions
      .filter((m) => m.customerId === customerId)
      .slice()
      .sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO)))
  }, [state.makeupConsultSessions, customerId])

  const [openPersonalId, setOpenPersonalId] = useState(null)
  const [openMakeupId, setOpenMakeupId] = useState(null)

  if (!customer) {
    return (
      <div>
        <PageHeader title="고객을 찾을 수 없습니다" />
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          목록으로
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
    navigate('/customers', { replace: true })
  }

  return (
    <div>
      <PageHeader title={customer.name} subtitle={customer.phone || '연락처 미입력'} />

      <CustomerBasicsEditor
        key={customer.updatedAt}
        customer={customer}
        onSave={(payload) =>
          actions.upsertCustomer({
            id: customer.id,
            ...payload,
          })
        }
      />

      <ResultShareCard customer={customer} />

      <div className="mb-10 grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-white to-klar-50">
          <p className="text-[11px] font-semibold text-klar-800">
            퍼스널컬러 진단
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {personalSessions.length}
            <span className="text-sm font-semibold text-slate-400"> 회</span>
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-[11px] font-semibold text-slate-700">
            메이크업 컨설팅
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {makeupSessions.length}
            <span className="text-sm font-semibold text-slate-400"> 회</span>
          </p>
        </Card>
      </div>

      {/* 퍼스널컬러 */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            진단 코스 · 퍼스널컬러
          </h2>
          <Link to={`/customers/${customer.id}/personal/new`}>
            <Button variant="secondary" className="px-3 py-2 text-[11px]">
              새 결과지
            </Button>
          </Link>
        </div>
        {personalSessions.length === 0 ? (
          <Card className="border-dashed border-klar-100 bg-white py-10 text-center text-sm text-slate-500">
            등록된 퍼스널컬러 결과지가 없습니다.
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {personalSessions.map((s) => {
              const expanded = openPersonalId === s.id
              const p1 = PERSONAL_TYPE_MAP[s.primaryTypeKey]?.label ?? s.primaryTypeKey
              const p2 = s.secondaryTypeKey
                ? PERSONAL_TYPE_MAP[s.secondaryTypeKey]?.label ?? s.secondaryTypeKey
                : null
              return (
                <li key={s.id}>
                  <Card className="overflow-hidden border-klar-100 p-0">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 border-b border-slate-50 bg-white px-4 py-3 text-left"
                      onClick={() =>
                        setOpenPersonalId((cur) => (cur === s.id ? null : s.id))
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-klar-800">
                          {formatDateKo(s.dateISO)}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-900">
                          {s.tone === 'warm' ? '웜톤' : '쿨톤'} · 1순위 {p1}
                          {p2 ? ` · 2순위 ${p2}` : ''}
                        </p>
                      </div>
                      <svg
                        className={`h-5 w-5 shrink-0 text-slate-400 transition ${
                          expanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {expanded ? (
                      <div className="space-y-3 bg-slate-50 px-4 py-4">
                        <div className="rounded-xl bg-white p-4 text-sm text-slate-700 shadow-inner shadow-slate-100">
                          <p className="text-xs font-semibold text-slate-500 mb-2">
                            특이사항 · 메모
                          </p>
                          <p className="whitespace-pre-wrap">{s.memo || '기록 없음'}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-inner shadow-slate-100">
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-klar-800">
                              결과 톤 맞춤 추천 제품
                            </p>
                            <p className="mt-1 text-[11px] leading-5 text-klar-500">
                              선택한 카테고리 탭 기준으로 추가 필터링할 수 있습니다.
                            </p>
                          </div>
                          <ProductCatalog
                            products={state.toneRecommendProducts}
                            categoryVisibility={state.productCategoryVisibility}
                            toneKeys={[s.primaryTypeKey, s.secondaryTypeKey].filter(Boolean)}
                            emptyMessage="이 결과 톤에 맞는 노출 제품이 아직 없습니다."
                          />
                        </div>
                        <Link to={`/customers/${customer.id}/personal/${s.id}`}>
                          <Button variant="secondary" className="w-full py-3 text-xs">
                            결과지 수정하기
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 메이크업 */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            진단 코스 · 메이크업 컨설팅
          </h2>
          <Link to={`/customers/${customer.id}/consult/new`}>
            <Button variant="secondary" className="px-3 py-2 text-[11px]">
              새 기록
            </Button>
          </Link>
        </div>
        {makeupSessions.length === 0 ? (
          <Card className="border-dashed py-10 text-center text-sm text-slate-500">
            등록된 메이크업 컨설팅 기록이 없습니다.
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {makeupSessions.map((m) => {
              const expanded = openMakeupId === m.id
              return (
                <li key={m.id}>
                  <Card className="overflow-hidden p-0 border-slate-100">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left bg-white"
                      onClick={() =>
                        setOpenMakeupId((cur) => (cur === m.id ? null : m.id))
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700">
                          {formatDateKo(m.dateISO)}
                        </p>
                        <p className="mt-1 text-sm text-slate-900">
                          사용 제품 {m.products?.length ?? 0}개
                        </p>
                      </div>
                      <svg
                        className={`h-5 w-5 shrink-0 text-slate-400 transition ${
                          expanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {expanded ? (
                      <div className="space-y-3 bg-slate-50 px-4 py-4">
                        {m.memo ? (
                          <div className="rounded-xl bg-white p-4 text-sm text-slate-700 shadow-inner">
                            <p className="text-xs font-semibold text-slate-500 mb-1">
                              세션 메모
                            </p>
                            <p className="whitespace-pre-wrap">{m.memo}</p>
                          </div>
                        ) : null}
                        <div className="rounded-xl bg-white shadow-inner divide-y divide-slate-100 overflow-hidden">
                          {(m.products ?? []).length === 0 ? (
                            <p className="px-4 py-4 text-xs text-slate-500">
                              등록된 제품이 없습니다.
                            </p>
                          ) : (
                            <ul className="max-h-64 overflow-y-auto">
                              {m.products.map((p, idx) => (
                                <li
                                  key={p.lineId ?? idx}
                                  className="border-b border-slate-50 last:border-0 px-4 py-3 text-xs"
                                >
                                  <p className="font-semibold text-slate-900">
                                    [{p.category}] {p.productName || '제품명 미입력'}
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-600">
                                    {p.brand}
                                    {p.shade ? ` · ${p.shade}` : ''}
                                  </p>
                                  {p.memo ? (
                                    <p className="mt-1 text-[11px] text-slate-500">
                                      {p.memo}
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <Link to={`/customers/${customer.id}/consult/${m.id}`}>
                          <Button variant="secondary" className="w-full py-3 text-xs">
                            기록 수정하기
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Button variant="danger" className="w-full mb-10" type="button" onClick={removeCustomer}>
        고객 삭제 (관련 데이터 모두 삭제)
      </Button>
    </div>
  )
}
