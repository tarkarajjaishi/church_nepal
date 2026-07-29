'use client'

import React, { useState } from 'react'
import Image from 'next/image'

const ChurchPlaceholder = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center bg-church-blue/10 ${className ?? ''}`}>
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-church-blue/30">
      <path d="M10 9h4"/>
      <path d="M12 7v5"/>
      <path d="M14 22v-4a2 2 0 0 0-4 0v4"/>
      <path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"/>
      <path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7"/>
    </svg>
  </div>
)

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackClassName?: string
  /**
   * Render through next/image, filling a positioned parent. Only pass this when
   * the immediate parent is `relative`/`absolute` and has a height — otherwise
   * the image collapses.
   */
  fill?: boolean
  /** Load eagerly at high priority. Use for the LCP image only. */
  priority?: boolean
  /** Responsive candidate widths; defaults to a sensible full-width ladder. */
  sizes?: string
}

/**
 * Image with a branded placeholder on error or missing src.
 *
 * With `fill`, this goes through next/image, which brings srcset/WebP,
 * lazy-loading and — because the parent reserves the box — no layout shift.
 * Without it, we fall back to a plain <img>, still lazy by default. The raw
 * path exists because next/image needs either `fill` with a positioned parent
 * or explicit width/height, and a handful of call sites have neither.
 */
export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const {
    src,
    alt,
    style,
    className,
    fallbackClassName,
    fill,
    priority,
    sizes,
    loading,
    ...rest
  } = props

  if (!src || didError) {
    return <ChurchPlaceholder className={`${className ?? ''} ${fallbackClassName ?? ''}`} />
  }

  if (fill) {
    return (
      <Image
        src={src as string}
        alt={alt ?? ''}
        fill
        className={className}
        style={style}
        priority={priority}
        // Without this the browser assumes 100vw and downloads far more than a
        // card-sized slot needs.
        sizes={sizes ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        onError={handleError}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      {...rest}
      onError={handleError}
    />
  )
}
