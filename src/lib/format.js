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

export function isoDateOnly(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
