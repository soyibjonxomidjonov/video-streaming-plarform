'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Film, Play, Star } from 'lucide-react'
import { mediaImage, mediaRating, mediaTitle, mediaYear, type MediaItem, formatDuration } from '@/lib/api'

type Props = {
  item: MediaItem
  type: 'movie' | 'series'
  linkTo?: 'detail' | 'watch'
}

export default function MediaCard({ item, type, linkTo = 'detail' }: Props) {
  const [imgError, setImgError] = useState(false)
  const rating = mediaRating(item)
  const year = mediaYear(item)
  const image = mediaImage(item)
  const title = mediaTitle(item)

  const href = linkTo === 'watch'
    ? `/watch/${type}/${item.id}`
    : type === 'movie'
      ? `/movie/${item.id}`
      : `/series/${item.id}`

  return (
    <Link
      href={href}
      className="media-card group flex flex-col overflow-hidden rounded-xl border border-border bg-surface sm:rounded-2xl"
    >
      {/* POSTER CONTAINER */}
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-2">
        {image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Fallback Poster Card */
          <div
            className="flex size-full flex-col items-center justify-between p-3 text-center sm:p-4"
            style={{ background: 'linear-gradient(135deg, #20232b, #0b0c10)' }}
          >
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-primary uppercase">
              S-M
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary sm:size-11">
                <Film size={18} />
              </div>
              <span className="line-clamp-2 px-1 font-display text-xs font-bold text-foreground">{title}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">{year ?? 'Kino'}</div>
          </div>
        )}

        {/* Hover Overlay & Play Icon */}
        <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
          <div className="flex size-11 scale-90 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform group-hover:scale-100">
            <Play size={18} fill="currentColor" className="translate-x-0.5" />
          </div>
        </div>

        {/* Rating Badge */}
        {rating !== null && (
          <div className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2">
            <span className="flex items-center gap-1 rounded-md border border-white/10 bg-black/80 px-1.5 py-0.5 text-[11px] font-bold text-accent backdrop-blur-xs">
              <Star size={10} className="fill-accent text-accent" />
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2">
          <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-xs">
            {type === 'series' ? 'Serial' : 'Film'}
          </span>
        </div>
      </div>

      {/* CARD INFO */}
      <div className="flex flex-col gap-1 p-2 sm:p-2.5">
        <h3 className="truncate text-xs font-bold text-foreground transition group-hover:text-primary" title={title}>
          {title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{year ?? '—'}</span>
          {item.duration_seconds && <span>{formatDuration(item.duration_seconds)}</span>}
        </div>
      </div>
    </Link>
  )
}
