import { useState } from 'react'
import { cn } from '../lib/cn.js'
import { Icon } from './Icon.jsx'
import { Button, Field, Input } from './Ui.jsx'

const ERROR_MESSAGES = {
  invalid_url: '주소 형식이 올바르지 않습니다. https:// 로 시작하는 주소를 넣어 주세요.',
  blocked_host: '이 주소는 불러올 수 없습니다. 쇼핑몰 제품 페이지 주소를 넣어 주세요.',
  unsupported_protocol: 'http:// 또는 https:// 주소만 사용할 수 있습니다.',
  timeout: '페이지 응답이 너무 느립니다. 잠시 후 다시 시도해 주세요.',
  not_html: '제품 페이지가 아닌 것 같습니다. 상품 상세 페이지 주소를 넣어 주세요.',
  http_error: '페이지를 열 수 없습니다. 주소가 맞는지 확인해 주세요.',
  too_many_requests: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
}

/**
 * Paste a product page URL, pull the page's own metadata, and let the user
 * pick which image and option to register. Nothing is applied automatically —
 * the fetched values land in the form for review first.
 */
export function ProductImport({ onApply }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [pickedImage, setPickedImage] = useState('')
  const [pickedVariant, setPickedVariant] = useState('')

  async function handleFetch(e) {
    e.preventDefault()
    if (busy || !url.trim()) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/products/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ url: url.trim() }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.data) {
        setError(ERROR_MESSAGES[payload?.error] ?? '제품 정보를 가져오지 못했습니다.')
        setResult(null)
        return
      }
      setResult(payload.data)
      setPickedImage(payload.data.images?.[0] ?? '')
      setPickedVariant('')
    } catch {
      setError('연결에 실패했습니다. 인터넷 상태를 확인해 주세요.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  function apply() {
    if (!result) return
    const name = pickedVariant
      ? `${result.productName} ${pickedVariant}`.trim()
      : result.productName
    onApply({
      brand: result.brand,
      productName: name,
      imageUrl: pickedImage,
      purchaseLink: result.sourceUrl,
    })
  }

  const hasNothing =
    result && !result.productName && !result.brand && result.images.length === 0

  return (
    <div className="rounded-lg border border-dashed border-klar-300 bg-klar-50/60 p-4">
      <div className="mb-3 flex items-start gap-2">
        <Icon name="link" className="mt-0.5 h-4 w-4 shrink-0 text-klar-600" />
        <div>
          <p className="text-[14px] font-semibold text-ink">링크로 제품 불러오기</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            쇼핑몰 제품 페이지 주소를 붙여넣으면 제품명·브랜드·이미지를 자동으로 채웁니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleFetch} className="space-y-2.5">
        <Field error={error || undefined}>
          <Input
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (error) setError('')
            }}
            placeholder="https://smartstore.naver.com/..."
            aria-label="제품 페이지 주소"
          />
        </Field>
        <Button type="submit" variant="secondary" className="w-full" disabled={busy || !url.trim()}>
          {busy ? '불러오는 중…' : '정보 가져오기'}
        </Button>
      </form>

      {result ? (
        <div className="mt-4 space-y-3.5 border-t border-klar-200 pt-4">
          {hasNothing ? (
            <p className="text-xs leading-5 text-amber-700">
              이 페이지에서는 제품 정보를 찾지 못했습니다. 아래 칸에 직접 입력해 주세요.
            </p>
          ) : null}

          <div>
            <p className="text-[11px] font-semibold text-ink-soft">가져온 제품명</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {result.productName || '(없음)'}
            </p>
            {result.brand ? (
              <p className="mt-0.5 text-xs text-ink-muted">브랜드 · {result.brand}</p>
            ) : null}
          </div>

          {result.images.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold text-ink-soft">
                이미지 선택 ({result.images.length}장)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {result.images.slice(0, 12).map((image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setPickedImage(image)}
                    aria-pressed={pickedImage === image}
                    className={cn(
                      'aspect-square overflow-hidden rounded-md border-2 bg-white transition',
                      pickedImage === image
                        ? 'border-klar-600 ring-2 ring-klar-500/25'
                        : 'border-line hover:border-klar-400',
                    )}
                  >
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {result.variants.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold text-ink-soft">
                세부 품목 · 색상 ({result.variants.length}개)
              </p>
              <p className="mb-2 text-[11px] leading-5 text-ink-muted">
                하나를 고르면 제품명 뒤에 붙습니다. 색상별로 따로 등록할 때 쓰세요.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.variants.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() =>
                      setPickedVariant((current) => (current === variant ? '' : variant))
                    }
                    aria-pressed={pickedVariant === variant}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition',
                      pickedVariant === variant
                        ? 'border-klar-600 bg-klar-600 text-white'
                        : 'border-line-strong bg-white text-ink-soft hover:border-klar-400',
                    )}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Button className="w-full" onClick={apply} icon="check">
            아래 칸에 채우기
          </Button>
        </div>
      ) : null}
    </div>
  )
}
