import { Link } from 'react-router-dom'
import { Icon } from './Icon.jsx'
import { Avatar, Badge, CardLink } from './Ui.jsx'

/**
 * One customer row, shared by the dashboard "최근 고객" list and the
 * customer directory. `trailing` holds whatever extra the page wants to show.
 */
export function CustomerCard({ customer, trailing, size = 'md' }) {
  return (
    <Link to={`/customers/${customer.id}`} className="block">
      <CardLink>
        <div className="flex items-center gap-3">
          <Avatar name={customer.name} size={size} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink">{customer.name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              {customer.phone || '연락처 미등록'}
            </p>
          </div>
          {trailing}
          <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-ink-faint" />
        </div>
      </CardLink>
    </Link>
  )
}

/**
 * "기록 n" pill. Customers without records show nothing at all — a row of
 * "기록 없음" badges only added noise to the list.
 */
export function RecordCountBadge({ count }) {
  if (!count) return null
  return <Badge tone="brand">기록 {count}</Badge>
}
