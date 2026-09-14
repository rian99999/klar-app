import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav.jsx'
import { Icon, Wordmark } from '../components/Icon.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { cn } from '../lib/cn.js'

/** Routes that own the full viewport (immersive forms with their own action bar). */
const FULL_BLEED_ROUTES = [
  /\/customers\/new$/,
  /\/customers\/[^/]+\/personal\//,
  /\/customers\/[^/]+\/consult\//,
  /\/appointments\/new$/,
  /\/appointments\/[^/]+\/edit$/,
]

const SYNC_LABELS = {
  saving: { text: '저장 중', tone: 'text-klar-500' },
  saved: { text: '저장됨', tone: 'text-klar-600' },
  offline: { text: '오프라인', tone: 'text-amber-600' },
}

function SyncBadge({ status }) {
  const label = SYNC_LABELS[status]
  if (!label) return null
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-medium',
        label.tone,
      )}
      role="status"
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full bg-current',
          status === 'saving' ? 'animate-pulse' : null,
        )}
      />
      {label.text}
    </span>
  )
}

export function MainLayout() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const { syncStatus } = useAppData()
  const { role, logout } = useAuth()

  /**
   * Open a new page at the top. Going back (POP) keeps the browser's own
   * position so returning to a long list lands where the user left it.
   */
  useEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, navigationType])

  const hideChrome = FULL_BLEED_ROUTES.some((pattern) => pattern.test(pathname))

  return (
    <div className="min-h-[100dvh] pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
      {!hideChrome ? (
        <header className="sticky top-0 z-30 border-b border-line/80 bg-klar-50/85 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] shadow-[0_1px_0_rgb(255_255_255/.6)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <Link to="/" className="group flex items-center gap-3 rounded-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-klar-200 to-pearl-100 shadow-inset">
                <Wordmark className="text-base text-klar-700" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="brand-kicker block">빛나는 당신을 위해</span>
                <span className="block truncate text-[13px] font-semibold text-ink">
                  Color &amp; Makeup Studio
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <SyncBadge status={syncStatus} />
              {role === 'admin' ? (
                <Link
                  to="/admin"
                  aria-label="관리자 페이지"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white/80 text-ink-muted transition hover:border-klar-300 hover:text-klar-700"
                >
                  <Icon name="shield" className="h-4 w-4" />
                </Link>
              ) : null}
              <button
                type="button"
                onClick={logout}
                aria-label="로그아웃"
                title="로그아웃"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white/80 text-ink-muted transition hover:border-klar-300 hover:text-klar-700"
              >
                <Icon name="logout" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
      ) : null}

      <main
        key={pathname}
        className="mx-auto w-full max-w-lg animate-fade-up px-4 py-6"
      >
        <Outlet />
      </main>

      {!hideChrome ? <BottomNav pathname={pathname} /> : null}
    </div>
  )
}
