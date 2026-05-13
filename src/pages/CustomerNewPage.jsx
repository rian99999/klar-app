import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import { Button, Card, Field, Input, Label, PageHeader, Textarea } from '../components/Ui.jsx'

export function CustomerNewPage() {
  const navigate = useNavigate()
  const { actions } = useAppData()
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
    if (id) navigate(`/customers/${id}`, { replace: true })
    else navigate('/customers', { replace: true })
  }

  return (
    <div>
      <PageHeader title="신규 고객 등록" />

      <form onSubmit={handleSubmit}>
        <Card className="mb-24 space-y-4">
          <Field label="이름 · 닉네임">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
            />
          </Field>
          <Field label="연락처">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>
          <Field label="이메일 (선택)">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
            />
          </Field>
          <div>
            <Label>메모</Label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="피부 고민 · 선호 컨셉 등"
              className="mt-1.5"
            />
          </div>
        </Card>

        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1 shadow-lg shadow-klar-900/15">
              저장
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
