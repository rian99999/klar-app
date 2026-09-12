import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { formatPhone } from '../lib/format.js'
import {
  Button,
  Card,
  Field,
  FORM_BOTTOM_SPACE,
  FormActionBar,
  Input,
  PageHeader,
  Textarea,
} from '../components/Ui.jsx'

export function CustomerNewPage() {
  const navigate = useNavigate()
  const { actions } = useAppData()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [memo, setMemo] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const id = actions.upsertCustomer({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      memo: memo.trim(),
    })
    toast(`${name.trim()}님을 등록했습니다.`)
    if (id) navigate(`/customers/${id}`, { replace: true })
    else navigate('/customers', { replace: true })
  }

  return (
    <div className={FORM_BOTTOM_SPACE}>
      <PageHeader
        title="신규 고객 등록"
        subtitle="이름만 있어도 저장할 수 있고, 나머지는 나중에 채워도 됩니다."
        back="/customers"
      />

      <form onSubmit={handleSubmit}>
        <Card className="space-y-5">
          <Field label="이름 · 닉네임">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
            />
          </Field>
          <Field
            label="연락처"
            hint="결과지 링크의 본인 확인에 뒷 4자리가 사용됩니다."
          >
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-0000-0000"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>
          <Field label="이메일" hint="선택 항목입니다.">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="메모">
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="피부 고민 · 선호 컨셉 등"
            />
          </Field>
        </Card>

        <FormActionBar>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate('/customers')}
          >
            취소
          </Button>
          <Button type="submit" className="flex-[1.6]" disabled={!name.trim()}>
            저장
          </Button>
        </FormActionBar>
      </form>
    </div>
  )
}
