import { Badge } from './Ui.jsx'

/**
 * The "당일 사용 제품" list. Rendered identically in the staff customer
 * detail page and in the client-facing result page.
 */
export function SessionProductList({ products = [], emptyMessage = '등록된 사용 제품이 없습니다.' }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      {products.length === 0 ? (
        <p className="px-4 py-4 text-sm text-ink-muted">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {products.map((product, index) => (
            <li key={product.lineId ?? index} className="flex gap-3 px-4 py-3.5">
              <Badge className="mt-0.5 shrink-0">{product.category}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {product.productName || '제품명 미입력'}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {[product.brand, product.shade].filter(Boolean).join(' · ') ||
                    '브랜드/색상 미입력'}
                </p>
                {product.memo ? (
                  <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-ink-muted">
                    {product.memo}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
