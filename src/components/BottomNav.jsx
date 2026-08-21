import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn.js'
import { Icon } from './Icon.jsx'

const TABS = [
  { path: '/', label: '홈', icon: 'home' },
  { path: '/customers', label: '고객', icon: 'users', matchPrefixes: ['/customers'] },
  { path: '/appointments', label: '예약', icon: 'calendar', matchPrefixes: ['/appointments'] },
  { path: '/makeup', label: '제품', icon: 'lipstick', matchPrefixes: ['/makeup', '/admin'] },
]

export function BottomNav({ pathname }) {
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 py-1.5">
        {TABS.map(({ path, label, icon, matchPrefixes }) => {
          const active =
            path === '/'
              ? pathname === '/' || pathname === ''
              : (matchPrefixes ?? [path]).some((prefix) => pathname.startsWith(prefix))
          return (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex min-h-[3.25rem] min-w-[4.25rem] flex-1 flex-col items-center',
                'justify-center gap-1 rounded-md text-[11px] font-semibold',
                'transition duration-200 ease-smooth',
                active ? 'text-klar-700' : 'text-ink-muted hover:text-klar-700',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-14 items-center justify-center rounded-full transition duration-200 ease-smooth',
                  active ? 'bg-klar-100' : 'group-hover:bg-klar-50',
                )}
              >
                <Icon
                  name={icon}
                  className="h-[1.35rem] w-[1.35rem]"
                  strokeWidth={active ? 2 : 1.6}
                />
              </span>
              {label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
