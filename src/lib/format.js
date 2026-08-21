export function formatDateKo(iso) {
  try {
    const d = typeof iso === 'string' ? new Date(iso) : iso
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    })
  } catch {
    return '—'
  }
}

/** Compact form for dense list rows: "8월 21일 (목)". */
export function formatDateShort(iso) {
  try {
    const d = typeof iso === 'string' ? new Date(iso) : iso
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  } catch {
    return '—'
  }
}

export function isoDateOnly(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Shifts a `YYYY-MM-DD` string by whole days without UTC drift. */
export function shiftIsoDate(iso, days) {
  const [y, m, d] = String(iso).split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  date.setDate(date.getDate() + days)
  return isoDateOnly(date)
}

/** The seven `YYYY-MM-DD` strings of the Mon–Sun week containing `iso`. */
export function weekDatesOf(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  const mondayOffset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(date)
    day.setDate(date.getDate() + i)
    return isoDateOnly(day)
  })
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

export function weekdayKo(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return Number.isNaN(date.getTime()) ? '' : WEEKDAYS_KO[date.getDay()]
}

export function dayOfMonth(iso) {
  return Number(String(iso).split('-')[2] ?? 0)
}

/** Human label for a date relative to today ("오늘", "내일", "3일 전"). */
export function relativeDayLabel(iso, today = isoDateOnly()) {
  if (iso === today) return '오늘'
  const diff = Math.round(
    (new Date(`${iso}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000,
  )
  if (Number.isNaN(diff)) return ''
  if (diff === 1) return '내일'
  if (diff === -1) return '어제'
  if (diff > 0) return `${diff}일 후`
  return `${Math.abs(diff)}일 전`
}

export function formatTime(time) {
  const value = String(time ?? '').slice(0, 5)
  return value || '시간 미정'
}

export function phoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

/** Formats Korean mobile/landline digits as the user types. */
export function formatPhone(value) {
  const digits = phoneDigits(value).slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.startsWith('02')) {
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  }
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function maskPhone(value) {
  const digits = phoneDigits(value)
  if (digits.length < 4) return '연락처 미등록'
  return `***-****-${digits.slice(-4)}`
}
