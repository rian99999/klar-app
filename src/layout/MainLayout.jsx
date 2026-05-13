import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav.jsx'

export function MainLayout() {
  const { pathname } = useLocation()

  const hideChrome =
    /\/customers\/new$/.test(pathname) ||
    /\/customers\/[^/]+\/personal\//.test(pathname) ||
    /\/customers\/[^/]+\/consult\//.test(pathname) ||
    /\/appointments\/new$/.test(pathname) ||
    /\/appointments\/[^/]+\/edit$/.test(pathname)

  return (
    <div className="min-h-[100dvh] pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {!hideChrome ? (
        <div className="sticky top-0 z-30 border-b border-klar-200/80 bg-klar-50/88 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] text-klar-900 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div>
              <p className="brand-kicker">빛나는 당신을 위해</p>
              <p className="font-display text-2xl leading-none tracking-tight text-klar-700">
                kl<span className="italic text-klar-500">a</span>r
              </p>
            </div>
            <p className="hidden text-right text-[9px] font-medium uppercase tracking-brand text-klar-400 min-[380px]:block">
              Color & Makeup
            </p>
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-lg px-4 py-6">
        <Outlet />
      </main>

      <BottomNav pathname={pathname} />
    </div>
  )
}
