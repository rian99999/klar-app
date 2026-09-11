import { useAuth } from '../context/AuthContext.jsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { Wordmark } from './Icon.jsx'

/** Blocks the staff app until the server confirms a session. */
export function AuthGate({ children }) {
  const { status } = useAuth()

  if (status === 'checking') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3">
        <Wordmark className="animate-pulse text-4xl text-klar-400" />
        <p className="text-xs text-ink-faint">확인 중…</p>
      </div>
    )
  }

  if (status !== 'authenticated') return <LoginPage />

  return children
}
