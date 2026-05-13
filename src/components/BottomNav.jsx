import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn.js'

const tabs = [
  {
    path: '/',
    label: '홈',
    icon: IconHome,
  },
  {
    path: '/customers',
    label: '고객',
    icon: IconUsers,
    end: false,
    matchPrefixes: ['/customers'],
  },
  {
    path: '/appointments',
    label: '예약',
    icon: IconCal,
    matchPrefixes: ['/appointments'],
  },
  {
    path: '/makeup',
    label: '메이크업',
    icon: IconLipstick,
    matchPrefixes: ['/makeup'],
  },
]

function IconHome({ active }) {
  return (
    <svg
      className={cn('h-6 w-6', active ? 'text-klar-600' : 'text-klar-300')}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.75"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  )
}

function IconUsers({ active }) {
  return (
    <svg
      className={cn('h-6 w-6', active ? 'text-klar-600' : 'text-klar-300')}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.75"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  )
}

function IconCal({ active }) {
  return (
    <svg
      className={cn('h-6 w-6', active ? 'text-klar-600' : 'text-klar-300')}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.75"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
      />
    </svg>
  )
}

function IconLipstick({ active }) {
  return (
    <svg
      className={cn('h-6 w-6', active ? 'text-klar-600' : 'text-klar-300')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 21h6v-9H9v9zm0-13h6V8a3 3 0 10-6 0v0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v16"
      />
    </svg>
  )
}

export function BottomNav({ pathname }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-klar-200/80 bg-white/90 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
        {tabs.map(({ path, label, icon: Icon, end, matchPrefixes }) => {
          const active =
            path === '/'
              ? pathname === '/' || pathname === ''
              : (matchPrefixes || [path]).some((p) => pathname.startsWith(p))
          return (
            <NavLink
              key={path}
              to={path}
              end={end ?? path === '/'}
              className={cn(
                'flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-[10px] py-2 text-[11px] font-medium transition',
                active
                  ? 'bg-klar-100/70 text-klar-700'
                  : 'text-klar-400 hover:bg-klar-100/50 hover:text-klar-700',
              )}
            >
              <Icon active={active} />
              {label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
