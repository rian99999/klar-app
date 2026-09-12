import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PERSONAL_TYPES } from '../data/constants.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { isoDateOnly } from '../lib/format.js'
import { cn } from '../lib/cn.js'
import { Icon } from '../components/Icon.jsx'
import {
  Button,
  Card,
  DateInput,
  Field,
  FORM_BOTTOM_SPACE,
  FormActionBar,
  PageHeader,
  SegmentedControl,
  Textarea,
} from '../components/Ui.jsx'

const TONE_OPTIONS = [
  { value: 'warm', label: '웜톤' },
  { value: 'cool', label: '쿨톤' },
]

/** Swatch previews so the type list reads as colour, not just as text. */
const TYPE_SWATCHES = {
  spring_warm_bright: ['#FF8A5B', '#FFC93C', '#FF6F91'],
  spring_warm_light: ['#FFCFA8', '#FFE7A3', '#FFB3A7'],
  autumn_warm_mute: ['#C08552', '#A38B62', '#9E6B4A'],
  autumn_warm_deep: ['#7B4A2D', '#8A6B23', '#5E3B24'],
  summer_cool_light: ['#CBD9F0', '#E7C6DC', '#BFD9D4'],
  summer_cool_bright: ['#6C8FD6', '#D96BA0', '#5FB8C4'],
  summer_cool_mute: ['#9AA7C2', '#B79BB0', '#8FAFA8'],
  winter_cool_vivid: ['#0F4CA8', '#D6006E', '#00A0A8'],
  winter_cool_deep: ['#12284B', '#5B1436', '#1E3A2F'],
}

function TypeOption({ type, selected, disabled, onSelect, badge }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(type.key)}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition duration-200 ease-smooth',
        'disabled:opacity-40',
        selected
          ? 'border-klar-600 bg-klar-50 shadow-card'
          : 'border-line-strong bg-white hover:border-klar-400',
      )}
    >
      <span className="flex shrink-0 gap-1" aria-hidden>
        {(TYPE_SWATCHES[type.key] ?? []).map((color) => (
          <span
            key={color}
            className="h-6 w-3 rounded-full border border-white/70 shadow-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink">
        {type.label}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-klar-600 px-2 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : selected ? (
        <Icon name="check" className="h-4 w-4 shrink-0 text-klar-600" />
      ) : null}
    </button>
  )
}

export function PersonalColorFormPage({ mode }) {
  const isNew = mode === 'new'
  const { customerId, sessionId } = useParams()
  const navigate = useNavigate()
  const { state, actions } = useAppData()
  const { toast } = useToast()

  const customer = state.customers.find((c) => c.id === customerId)
  const existing = !isNew
    ? state.personalColorSessions.find((s) => s.id === sessionId)
    : null

  const [tone, setTone] = useState(existing?.tone ?? 'warm')
  const [primary, setPrimary] = useState(existing?.primaryTypeKey ?? '')
  const [secondary, setSecondary] = useState(existing?.secondaryTypeKey ?? '')
  const [memo, setMemo] = useState(existing?.memo ?? '')
  const [isoDate, setIsoDate] = useState(() =>
    existing?.dateISO ? String(existing.dateISO).slice(0, 10) : isoDateOnly(),
  )

  const typed = useMemo(
    () => PERSONAL_TYPES.filter((t) => t.undertone === tone),
    [tone],
  )

  function changeTone(next) {
    setTone(next)
    setPrimary('')
    setSecondary('')
  }

  function selectPrimary(key) {
    setPrimary(key)
    if (secondary === key) setSecondary('')
  }

  function toggleSecondary(key) {
    setSecondary((current) => (current === key ? '' : key))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!customer) return
    if (!primary) {
      toast('1순위 타입을 선택해 주세요.', { tone: 'error' })
      return
    }
    if (!typed.some((t) => t.key === primary)) {
      toast('선택한 베이스 톤에 맞는 타입으로 다시 선택해 주세요.', { tone: 'error' })
      return
    }
    actions.upsertPersonalSession({
      id: existing?.id,
      customerId: customer.id,
      dateISO: new Date(`${isoDate}T12:00:00`).toISOString(),
      tone,
      primaryTypeKey: primary,
      secondaryTypeKey: secondary || null,
      memo,
    })
    toast(existing ? '결과지를 수정했습니다.' : '결과지를 저장했습니다.')
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  function remove() {
    if (!existing || !customer) return
    if (!window.confirm('이 결과지를 삭제할까요?')) return
    actions.deletePersonalSession(existing.id, customer.id)
    toast('결과지를 삭제했습니다.', { tone: 'info' })
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  if (!customer) {
    return (
      <div>
        <PageHeader title="고객을 찾지 못했습니다" back="/customers" />
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          고객 목록으로
        </Button>
      </div>
    )
  }

  if (!isNew && !existing) {
    return (
      <div>
        <PageHeader title="결과지를 찾을 수 없습니다" back={`/customers/${customerId}`} />
        <Button variant="secondary" onClick={() => navigate(`/customers/${customerId}`)}>
          돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className={FORM_BOTTOM_SPACE}>
      <PageHeader
        kicker="Personal Color"
        title={isNew ? '퍼스널컬러 결과지' : '결과지 수정'}
        subtitle={`${customer.name}님`}
        back={`/customers/${customer.id}`}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-5">
          <Field label="진단 일자">
            <DateInput
              required
              value={isoDate}
              onChange={(e) => e.target.value && setIsoDate(e.target.value)}
            />
          </Field>

          <Field label="베이스 톤">
            <SegmentedControl
              ariaLabel="베이스 톤"
              options={TONE_OPTIONS}
              value={tone}
              onChange={changeTone}
            />
          </Field>

          <Field
            label="1순위 타입"
            hint={primary ? undefined : '베이스 톤에 해당하는 타입 중 하나를 선택하세요.'}
          >
            <div className="space-y-2">
              {typed.map((type) => (
                <TypeOption
                  key={type.key}
                  type={type}
                  selected={primary === type.key}
                  onSelect={selectPrimary}
                  badge={primary === type.key ? '1순위' : null}
                />
              ))}
            </div>
          </Field>

          <Field label="2순위 타입" hint="선택 사항입니다. 다시 누르면 해제됩니다.">
            <div className="space-y-2">
              {typed
                .filter((t) => t.key !== primary)
                .map((type) => (
                  <TypeOption
                    key={type.key}
                    type={type}
                    selected={secondary === type.key}
                    onSelect={toggleSecondary}
                    badge={secondary === type.key ? '2순위' : null}
                  />
                ))}
            </div>
          </Field>

          <Field label="진단 메모 · 특이사항">
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="드레이핑 반응, 추천 배색, 주의할 컬러 등"
            />
          </Field>
        </Card>

        {existing ? (
          <Button variant="dangerQuiet" className="w-full" icon="trash" onClick={remove}>
            이 결과지 삭제
          </Button>
        ) : null}

        <FormActionBar>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(`/customers/${customer.id}`)}
          >
            닫기
          </Button>
          <Button type="submit" className="flex-[1.6]" disabled={!primary}>
            저장
          </Button>
        </FormActionBar>
      </form>
    </div>
  )
}
