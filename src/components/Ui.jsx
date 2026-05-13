/** @typedef {React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }} BtnProps */

import { cn } from '../lib/cn.js'

/** @param {BtnProps} props */
export function Button({ className = '', variant = 'primary', type = 'button', ...props }) {
  const base =
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-[4px] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'
  const styles = {
    primary:
      'bg-klar-500 text-white shadow-lift hover:bg-klar-600',
    secondary:
      'border border-klar-200 bg-white/80 text-klar-900 hover:border-klar-300 hover:bg-klar-100/70',
    ghost: 'bg-transparent text-klar-700 hover:bg-klar-100/70',
    danger: 'bg-rose-700 text-white hover:bg-rose-800',
  }
  return (
    <button
      type={type}
      className={cn(base, styles[variant], className)}
      {...props}
    />
  )
}

export function Card({ className = '', children }) {
  return (
    <div
      className={cn(
        'rounded-[14px] border border-klar-200/80 bg-white/88 p-4 shadow-card backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Label({ children, className }) {
  return (
    <label className={cn('mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-klar-500', className)}>
      {children}
    </label>
  )
}

export function Field({ label, children, className }) {
  return (
    <div className={cn('', className)}>
      {label ? <Label>{label}</Label> : null}
      {children}
    </div>
  )
}

export function Input(props) {
  return (
    <input
      className={cn(
        'w-full rounded-[10px] border border-klar-200 bg-white/85 px-3 py-2.5 text-sm font-light text-klar-900 outline-none ring-klar-400/25 placeholder:text-klar-400/70 focus:border-klar-500 focus:ring-2',
        props.className,
      )}
      {...props}
    />
  )
}

export function Select(props) {
  return (
    <select
      className={cn(
        'w-full rounded-[10px] border border-klar-200 bg-white/85 px-3 py-2.5 text-sm font-light text-klar-900 outline-none ring-klar-400/25 focus:border-klar-500 focus:ring-2',
        props.className,
      )}
      {...props}
    />
  )
}

export function Textarea(props) {
  return (
    <textarea
      className={cn(
        'min-h-[96px] w-full resize-y rounded-[10px] border border-klar-200 bg-white/85 px-3 py-2.5 text-sm font-light text-klar-900 outline-none ring-klar-400/25 placeholder:text-klar-400/70 focus:border-klar-500 focus:ring-2',
        props.className,
      )}
      {...props}
    />
  )
}

export function PageHeader({ title, subtitle, right }) {
  return (
    <header className="mb-6 flex items-start justify-between gap-3 border-b border-klar-200/80 pb-4">
      <div>
        <p className="brand-kicker mb-1">KLAR Studio</p>
        <h1 className="brand-title text-[1.75rem] leading-none">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-klar-500">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="flex shrink-0 gap-2">{right}</div> : null}
    </header>
  )
}
