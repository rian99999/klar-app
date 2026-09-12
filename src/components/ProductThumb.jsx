import { useState } from 'react'
import { cn } from '../lib/cn.js'

/**
 * Product image with the KLAR placeholder.
 * A dead image URL used to leave a broken-image icon in the grid; now it falls
 * back to the placeholder.
 */
export function ProductThumb({ product, className, placeholderClassName }) {
  const [failed, setFailed] = useState(false)
  const src = failed ? '' : product?.imageUrl

  return (
    <figure className={cn('aspect-square overflow-hidden bg-klar-50', className)}>
      {src ? (
        <img
          src={src}
          alt={product?.productName ?? ''}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-500 ease-smooth group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center bg-gradient-to-br from-klar-100 to-pearl-100 font-display text-klar-400',
            placeholderClassName ?? 'text-lg',
          )}
        >
          KLAR
        </div>
      )}
    </figure>
  )
}
