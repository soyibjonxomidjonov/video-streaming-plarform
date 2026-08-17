'use client'

import React, { memo, useState } from 'react'
import Link from 'next/link'
import { Film, Play, Star } from 'lucide-react'
import { mediaImage, mediaRating, mediaTitle, mediaYear, type MediaItem } from '@/lib/api'

type Props = {
  item: MediaItem
  type?: 'movie' | 'series'
  linkTo?: 'detail' | 'watch'
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}s ${m}d` : `${m} daq`
}

const MediaCard = memo(function MediaCard({ item, type = 'movie', linkTo = 'detail' }: Props) {
  const [imgError, setImgError] = useState(false)
  const rating = mediaRating(item)
  const year = mediaYear(item)
  const image = mediaImage(item)
  const title = mediaTitle(item)
  const contentType = item.type || type

  const href =
    linkTo === 'watch'
      ? `/watch/${contentType}/${item.id}`
      : contentType === 'movie'
        ? `/movie/${item.id}`
        : `/series/${item.id}`

  return (
    <Link
      href={href}
      prefetch={true}
      className="media-card group relative flex w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-[#0F171A] border border-[rgba(0,255,163,0.15)] transition-all duration-300 hover:border-[#00FFA3]/60 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,255,163,0.2)]"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#141F24]">
        {image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex size-full flex-col items-center justify-between p-4 text-center"
            style={{ background: 'linear-gradient(135deg, #141F24, #070A0C)' }}
          >
            <span className="text-[10px] font-black tracking-widest text-[#00FFA3] uppercase">
              S-M STREAM
            </span>
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-[rgba(0,255,163,0.25)] bg-[rgba(0,255,163,0.08)] text-[#00FFA3]">
                <Film size={26} />
              </div>
              <span className="line-clamp-2 px-2 font-display text-sm font-bold text-[#F8FAFC]">
                {title}
              </span>
            </div>
            <span className="text-xs font-medium text-[#64748B]">{year ?? '—'}</span>
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F171A] via-transparent to-transparent opacity-80" />

        {/* Hover Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#00FFA3]/90 text-[#070A0C] shadow-[0_0_30px_rgba(0,255,163,0.8)] transition-transform duration-200 group-hover:scale-110">
            <Play size={24} fill="currentColor" className="translate-x-0.5" />
          </div>
        </div>

        {/* Rating badge */}
        {rating !== null && (
          <div className="absolute left-3 top-3">
            <span className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.15)] bg-[#070A0C]/90 px-2.5 py-1 text-xs font-bold text-[#F59E0B] backdrop-blur-md">
              <Star size={12} className="fill-[#F59E0B] text-[#F59E0B]" />
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute right-3 top-3">
          <span className="rounded-lg border border-[rgba(0,255,163,0.3)] bg-[#0F171A]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00FFA3] backdrop-blur-md shadow-[0_0_15px_rgba(0,255,163,0.15)]">
            {contentType === 'series' ? 'Serial' : 'Film'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-col gap-1 p-4">
        <h3
          className="truncate font-display text-base sm:text-lg font-bold text-white transition-colors group-hover:text-[#00FFA3]"
          title={title}
        >
          {title}
        </h3>
        <div className="flex min-w-0 items-center justify-between text-sm text-slate-400 mt-1">
          <span className="font-medium">{year ?? '—'}</span>
          {item.duration_seconds ? (
            <span className="font-medium">{formatDuration(item.duration_seconds)}</span>
          ) : (
            <span className="font-bold text-[#00FFA3] tracking-wide">HD</span>
          )}
        </div>
      </div>
    </Link>
  )
})

export default MediaCard
