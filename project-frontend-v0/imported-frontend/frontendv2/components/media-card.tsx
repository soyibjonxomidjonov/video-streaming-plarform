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
      className="media-card group flex flex-col overflow-hidden rounded-2xl bg-surface border border-border"
    >
      {/* POSTER CONTAINER */}
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-900">
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
            className="flex size-full flex-col items-center justify-between p-4 text-center"
            style={{ background: 'linear-gradient(135deg, #1c1c24, #09090b)' }}
          >
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-violet-400 uppercase">
              S-M
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-11 items-center justify-center rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <Film size={20} />
              </div>
              <span className="font-display text-xs font-bold text-white line-clamp-2 px-1">{title}</span>
            </div>
            <div className="text-[10px] text-slate-400">{year ?? 'Kino'}</div>
          </div>
        )}

        {/* Hover Overlay & Play Icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play size={18} fill="currentColor" className="translate-x-0.5" />
          </div>
        </div>

        {/* Rating Badge */}
        {rating !== null && (
          <div className="absolute left-2 top-2">
            <span className="flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-bold text-amber-400 backdrop-blur-xs border border-white/10">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute right-2 top-2">
          <span className="rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            {type === 'series' ? 'Serial' : 'Film'}
          </span>
        </div>
      </div>

      {/* CARD INFO */}
      <div className="flex flex-col gap-1 p-2.5">
        <h3 className="truncate text-xs font-bold text-white group-hover:text-violet-400 transition" title={title}>
          {title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{year ?? '—'}</span>
          {item.duration_seconds && <span>{formatDuration(item.duration_seconds)}</span>}
        </div>
      </div>
    </Link>
  )
}
