import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/cn.js'
import { Icon } from './Icon.jsx'

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

const BUTTON_VARIANTS = {
  primary: 'bg-klar-600 text-white shadow-lift hover:bg-klar-700 active:bg-klar-800',
  secondary:
    'border border-line-strong bg-white text-ink shadow-card hover:border-klar-400 hover:bg-klar-50',
  subtle: 'bg-klar-100 text-klar-800 hover:bg-klar-200',
  ghost: 'text-klar-700 hover:bg-klar-100',
  danger: 'bg-rose-600 text-white shadow-lift hover:bg-rose-700',
  // Destructive but low-emphasis: a page-level delete should not out-shout Save.
  dangerQuiet:
    'border border-rose-200 bg-white text-rose-600 hover:border-rose-400 hover:bg-rose-50',
  quiet: 'border border-dashed border-line-strong text-ink-muted hover:border-klar-400 hover:text-klar-700',
}

const BUTTON_SIZES = {
  sm: 'min-h-[2.25rem] gap-1.5 px-3 text-[13px]',
  md: 'min-h-[2.75rem] gap-2 px-4 text-sm',
  lg: 'min-h-[3.25rem] gap-2 px-5 text-[15px]',
}

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'subtle'|'ghost'|'danger'|'quiet'} [props.variant]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {string} [props.icon] name from the shared Icon set
 */
export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon,
  iconRight,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-md font-medium',
        'transition duration-200 ease-smooth active:scale-[.985]',
        'disabled:pointer-events-none disabled:opacity-45',
        BUTTON_SIZES[size],
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {icon ? <Icon name={icon} className="h-[1.15em] w-[1.15em]" /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} className="h-[1.15em] w-[1.15em]" /> : null}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

export function Card({ className = '', as: As = 'div', children, ...rest }) {
  return (
    <As
      className={cn(
        'rounded-lg border border-line bg-white/92 shadow-card backdrop-blur-sm',
        'p-4',
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  )
}

/** Card that behaves as a tappable row (list items). */
export function CardLink({ className = '', children }) {
  return (
    <Card
      className={cn(
        'transition duration-200 ease-smooth hover:-translate-y-0.5 hover:border-klar-300 hover:shadow-lift',
        className,
      )}
    >
      {children}
    </Card>
  )
}

/* ------------------------------------------------------------------ *
 * Form primitives
 * ------------------------------------------------------------------ */

export function Label({ children, className, ...rest }) {
  return (
    <label className={cn('mb-2 block text-[13px] font-semibold text-ink-soft', className)} {...rest}>
      {children}
    </label>
  )
}

export function Field({ label, hint, error, children, className }) {
  return (
    <div className={className}>
      {label ? <Label>{label}</Label> : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-5 text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}

const CONTROL_BASE =
  'w-full rounded-md border border-line-strong bg-white px-3.5 py-3 text-[15px] text-ink ' +
  'outline-none transition duration-200 ease-smooth placeholder:text-ink-faint ' +
  'focus:border-klar-500 focus:ring-4 focus:ring-klar-500/12 disabled:bg-surface-sunken disabled:text-ink-muted'

export function Input({ className, ...props }) {
  return <input className={cn(CONTROL_BASE, className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(CONTROL_BASE, 'min-h-[7rem] resize-y leading-7', className)}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(CONTROL_BASE, 'appearance-none pr-10', className)}
        {...props}
      >
        {children}
      </select>
      <Icon
        name="chevronDown"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  )
}

/** Replaces the hand-rolled `<input type="date">` that was inlined on four pages. */
export function DateInput({ className, ...props }) {
  return <input type="date" className={cn(CONTROL_BASE, className)} {...props} />
}

export function TimeInput({ className, ...props }) {
  return <input type="time" className={cn(CONTROL_BASE, className)} {...props} />
}

export function SearchInput({ className, onClear, value, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <Icon
        name="search"
        className="pointer-events-none absolute left-3.5 top-1/2 h-[1.15rem] w-[1.15rem] -translate-y-1/2 text-ink-faint"
      />
      <input
        type="search"
        value={value}
        className={cn(CONTROL_BASE, 'pl-11', value && onClear ? 'pr-11' : null)}
        {...props}
      />
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="검색어 지우기"
          className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition hover:bg-klar-100 hover:text-ink"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

/** Segmented pill switch — used for tone toggles and list filters. */
export function SegmentedControl({ options, value, onChange, className, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex gap-1 rounded-lg border border-line bg-surface-sunken p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-[10px] px-3 py-2 text-[13px] font-semibold transition duration-200 ease-smooth',
              active
                ? 'bg-white text-klar-800 shadow-card'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Page & section structure
 * ------------------------------------------------------------------ */

export function PageHeader({ title, subtitle, right, kicker = 'KLAR Studio', back }) {
  const navigate = useNavigate()
  return (
    <header className="mb-6">
      {back ? (
        <button
          type="button"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          className="mb-3 -ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium text-ink-muted transition hover:bg-klar-100 hover:text-klar-700"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          뒤로
        </button>
      ) : null}
      <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
        <div className="min-w-0">
          {kicker ? <p className="brand-kicker mb-1.5">{kicker}</p> : null}
          <h1 className="brand-title text-[1.6rem] leading-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="flex shrink-0 gap-2 pt-1">{right}</div> : null}
      </div>
    </header>
  )
}

/** The kicker + heading + trailing action block repeated on every list section. */
export function SectionHeader({ kicker, title, count, action, className }) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {kicker ? <p className="brand-kicker">{kicker}</p> : null}
        <h2 className="brand-title flex items-baseline gap-2 text-lg leading-tight">
          {title}
          {count != null ? (
            <span className="text-sm font-sans font-semibold tabular-nums text-klar-500">
              {count}
            </span>
          ) : null}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/** Every "아직 없습니다" block in the app renders through here. */
export function EmptyState({ icon = 'sparkle', title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-white/60 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-klar-100 text-klar-500">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-[26rem] text-sm leading-6 text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 w-full max-w-[16rem]">{action}</div> : null}
    </div>
  )
}

/**
 * Sticky save/cancel bar. Was copy-pasted with four slightly different
 * paddings and border colours across the form pages.
 */
export function FormActionBar({ children }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg gap-2">{children}</div>
    </div>
  )
}

/** Spacer that keeps content clear of FormActionBar. */
export const FORM_BOTTOM_SPACE = 'pb-[7.5rem]'

/* ------------------------------------------------------------------ *
 * Data display
 * ------------------------------------------------------------------ */

const BADGE_TONES = {
  neutral: 'border-line-strong bg-surface-sunken text-ink-soft',
  brand: 'border-klar-200 bg-klar-100 text-klar-800',
  warm: 'border-warm-100 bg-warm-50 text-warm-700',
  cool: 'border-cool-100 bg-cool-50 text-cool-700',
  pearl: 'border-pearl-200 bg-pearl-50 text-pearl-500',
}

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
        BADGE_TONES[tone] ?? BADGE_TONES.neutral,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatTile({ label, value, suffix, className }) {
  return (
    <div className={cn('px-4 py-3', className)}>
      <p className="brand-kicker">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-none tabular-nums text-ink">
        {value}
        {suffix ? (
          <span className="ml-1 text-xs font-medium text-ink-muted">{suffix}</span>
        ) : null}
      </p>
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton h-4 w-full', className)} aria-hidden />
}

export function SkeletonList({ rows = 3 }) {
  return (
    <ul className="flex flex-col gap-2" aria-label="불러오는 중">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i}>
          <Card className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  )
}
