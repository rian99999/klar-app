import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Icon, Wordmark } from '../components/Icon.jsx'
import { Button, Card, Field, Input } from '../components/Ui.jsx'

/** The studio's entry screen — everything except /result/:id sits behind it. */
export function LoginPage() {
  const { login, usingDevPassword } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const result = await login(password)
    setBusy(false)
    if (result.ok) {
      setPassword('')
      setError('')
      return
    }
    setError(result.message)
    setPassword('')
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <Wordmark className="text-5xl text-klar-700" />
        <p className="brand-kicker mt-3">Color &amp; Makeup Studio</p>
      </div>

      <Card className="space-y-6 p-5">
        <div>
          <h1 className="brand-title text-2xl">스튜디오 접속</h1>
          <p className="mt-2.5 text-sm leading-6 text-ink-muted">
            고객 정보를 보호하기 위해 비밀번호 확인 후 이용할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="비밀번호" error={error || undefined}>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError('')
              }}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              autoFocus
              required
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? '확인 중…' : '접속하기'}
          </Button>
        </form>

        {usingDevPassword ? (
          <p className="flex items-start gap-2 rounded-md bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-700">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
            서버에 <code className="font-mono">KLAR_PASSWORD</code> 가 설정되지 않아 개발용
            비밀번호가 쓰이고 있습니다. 배포 전에 반드시 설정해 주세요.
          </p>
        ) : null}
      </Card>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-faint">
        <Icon name="shield" className="h-3.5 w-3.5" />
        고객 결과지 링크는 이 로그인 없이 열람할 수 있습니다.
      </p>
    </main>
  )
}
