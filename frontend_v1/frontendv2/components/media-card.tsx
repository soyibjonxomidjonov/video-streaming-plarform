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
  if (!seconds || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}s ${m}d`
  if (h > 0) return `${h}s`
  return `${m}d`
}

const MediaCard = memo(function MediaCard({ item, type = 'movie', linkTo = 'detail' }: Props) {
  const [imgError, setImgError] = useState(false)
  const rating = mediaRating(item)
  const year = mediaYear(item)
  const image = mediaImage(item)
  const title = mediaTitle(item)
  const contentType = item.type || type
  const duration = formatDuration(item.duration_seconds)

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
      className="group relative flex flex-col w-full outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A0C] rounded-2xl"
      aria-label={`${title} — ${contentType === 'series' ? 'Serial' : 'Film'}${year ? `, ${year}` : ''}`}
    >
      {/* Poster Wrapper - STRICT 2:3 Aspect Ratio */}
      <div
        className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl bg-[#0F171A] border border-[rgba(0,255,163,0.1)] shadow-lg transition-all duration-500 ease-out group-hover:shadow-[0_8px_30px_rgba(0,255,163,0.15)] group-hover:-translate-y-1"
        style={{ aspectRatio: '2 / 3' }}
      >
        {/* Image */}
        {image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${title} muqovasi`}
            loading="lazy"
            onError={() => setImgError(true)}
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className="flex size-full flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#141F24] to-[#070A0C]"
            role="img"
            aria-label={`${title} — rasm mavjud emas`}
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#070A0C]/50 text-[#64748B] mb-3">
              <Film size={24} aria-hidden="true" />
            </div>
            <span className="text-[10px] tracking-widest text-[#64748B] uppercase font-bold">StreamVibe</span>
          </div>
        )}

        {/* Hover Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070A0C]/90 via-[#070A0C]/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" aria-hidden="true" />

        {/* Floating Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 scale-90 group-hover:scale-100 pointer-events-none" aria-hidden="true">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#00FFA3] text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.4)]">
            <Play size={24} fill="currentColor" className="translate-x-0.5" />
          </div>
        </div>

        {/* Rating Badge - Absolute top left */}
        {rating !== null && (
          <div className="absolute left-3 top-3 z-10">
            <span className="flex items-center gap-1 rounded-md bg-[#070A0C]/80 backdrop-blur-md px-2 py-1 text-xs font-bold text-[#F59E0B] border border-white/10">
              <Star size={10} className="fill-[#F59E0B]" aria-hidden="true" />
              <span aria-label={`Reyting ${rating.toFixed(1)}`}>{rating.toFixed(1)}</span>
            </span>
          </div>
        )}

        {/* Content Type Badge - Absolute top right */}
        <div className="absolute right-3 top-3 z-10" aria-hidden="true">
          <span className="rounded-md bg-[#00FFA3]/10 backdrop-blur-md border border-[#00FFA3]/30 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#00FFA3]">
            {contentType === 'series' ? 'Serial' : 'Film'}
          </span>
        </div>
      </div>

      {/* External Info Area */}
      <div className="flex flex-col gap-1.5 mt-4 px-1">
        <h3 className="font-display text-sm sm:text-base font-bold text-zinc-100 line-clamp-1 transition-colors group-hover:text-[#00FFA3]">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span>{year ?? '—'}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" aria-hidden="true" />
          {duration ? (
            <span aria-label={`Davomiyligi ${duration}`}>{duration}</span>
          ) : (
            <span className="text-[10px] uppercase tracking-wide font-bold text-[#00FFA3]" aria-label="Yuqori sifat">HD</span>
          )}
        </div>
      </div>
    </Link>
  )
})

export default MediaCard
