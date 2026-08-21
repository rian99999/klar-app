import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { cn } from '../lib/cn.js'
import { createId } from '../lib/ids.js'
import { Icon } from './Icon.jsx'

const ToastContext = createContext(null)

const TONE_STYLES = {
  success: 'border-klar-300 bg-klar-800 text-white',
  info: 'border-line-strong bg-ink text-white',
  error: 'border-rose-300 bg-rose-700 text-white',
}

const TONE_ICONS = {
  success: 'check',
  info: 'sparkle',
  error: 'close',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (message, { tone = 'success', duration = 2600 } = {}) => {
      const id = createId()
      setToasts((current) => [...current.slice(-2), { id, message, tone }])
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), duration),
      )
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => dismiss(item.id)}
            className={cn(
              'pointer-events-auto flex w-full max-w-[24rem] animate-toast-in items-center gap-2.5',
              'rounded-md border px-4 py-3 text-left text-sm font-medium shadow-pop',
              TONE_STYLES[item.tone] ?? TONE_STYLES.info,
            )}
          >
            <Icon name={TONE_ICONS[item.tone] ?? 'sparkle'} className="h-4 w-4 opacity-90" />
            <span className="flex-1 leading-5">{item.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- non-component hook API
export function useToast() {
  const ctx = useContext(ToastContext)
  // Returning a no-op keeps components usable outside the provider (e.g. tests).
  return ctx ?? { toast: () => {}, dismiss: () => {} }
}
