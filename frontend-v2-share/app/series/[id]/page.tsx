'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Play, Star, Tv, Loader2 } from 'lucide-react'
import { api, mediaDescription, mediaImage, mediaRating, mediaTitle, mediaYear, unwrapList, type Episode, type MediaItem, type Comment } from '@/lib/api'
import SeriesDetailClient from './series-detail-client'

type Props = { params: Promise<{ id: string }> }

export default function SeriesDetailPage({ params }: Props) {
  const { id } = use(params)
  const [series, setSeries] = useState<MediaItem | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [sRes, epRes, cRes] = await Promise.allSettled([
          api.serie(id),
          api.seriesEpisodes(id),
          api.seriesComments(id),
        ])
        if (!active) return
        if (sRes.status === 'fulfilled') {
          const item = sRes.value
          setSeries(item)
          if (item.episodes) setEpisodes(item.episodes)
        }
        if (epRes.status === 'fulfilled' && epRes.value) {
          const epList = unwrapList(epRes.value) as Episode[]
          if (epList.length > 0) setEpisodes(epList)
        }
        if (cRes.status === 'fulfilled') {
          setComments(unwrapList(cRes.value))
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-[#00e599]" size={36} />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-[#f5f7f6]">Serial topilmadi</h2>
        <Link href="/series" className="mt-4 inline-block text-xs font-bold text-[#00e599]">
          ← Seriallarga qaytish
        </Link>
      </div>
    )
  }

  const image = mediaImage(series)
  const backdrop = mediaImage(series, 'backdrop')
  const rating = mediaRating(series)
  const year = mediaYear(series)
  const firstEp = episodes[0]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Top Back Link */}
      <Link
        href="/series"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#8c9994] transition hover:text-[#00e599]"
      >
        <ArrowLeft size={15} /> Seriallarga qaytish
      </Link>

      {/* HERO BACKDROP BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(0,229,153,0.2)] bg-[#101514] shadow-2xl">
        <div className="relative h-[260px] sm:h-[340px] md:h-[420px] overflow-hidden">
          {backdrop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={backdrop}
              alt=""
              className="size-full object-cover object-center opacity-40"
            />
          ) : (
            <div className="size-full bg-gradient-to-br from-[#0d4d38]/30 via-[#101514] to-[#080a0a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101514] via-[#101514]/60 to-transparent" />
        </div>

        {/* Content Info overlay */}
        <div className="relative -mt-24 p-6 sm:-mt-32 sm:p-8 lg:-mt-40 lg:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* Poster */}
            <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-52 md:w-60">
              <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-[rgba(0,229,153,0.3)] bg-[#161f1c] shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,153,0.25)]">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={mediaTitle(series)} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center">
                    <Tv size={36} className="text-[#00e599]" />
                    <span className="text-xs font-semibold text-[#8c9994]">{mediaTitle(series)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Series Info */}
            <div className="flex flex-1 flex-col gap-3">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-[rgba(0,229,153,0.3)] bg-[#00e599]/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#00e599]">
                  Serial
                </span>
                {year && (
                  <span className="flex items-center gap-1 text-xs text-[#8c9994]">
                    <Calendar size={13} /> {year}
                  </span>
                )}
                {episodes.length > 0 && (
                  <span className="text-xs font-bold text-[#00e599]">
                    {episodes.length} ta qism
                  </span>
                )}
                {rating !== null && (
                  <span className="flex items-center gap-1 rounded-md border border-[rgba(255,255,255,0.1)] bg-[#080a0a]/80 px-2 py-0.5 text-xs font-bold text-[#ffb703]">
                    <Star size={12} className="fill-[#ffb703] text-[#ffb703]" /> {rating.toFixed(1)} / 5
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-2xl font-black tracking-tight text-[#f5f7f6] sm:text-4xl lg:text-5xl">
                {mediaTitle(series)}
              </h1>

              {/* Genres */}
              {series.genres && series.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 my-1">
                  {series.genres.map((g, idx) => {
                    const genreName = typeof g === 'object' ? g.name : String(g)
                    return (
                      <Link
                        key={`genre-${idx}`}
                        href={`/genre/${encodeURIComponent(genreName)}`}
                        className="rounded-xl border border-[rgba(0,229,153,0.2)] bg-[rgba(0,229,153,0.08)] px-3 py-1 text-xs font-bold text-[#00e599] transition hover:bg-[rgba(0,229,153,0.2)]"
                      >
                        {genreName}
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Description */}
              {mediaDescription(series) && (
                <p className="max-w-2xl text-sm leading-relaxed text-[#8c9994]">
                  {mediaDescription(series)}
                </p>
              )}

              {/* Watch Action */}
              <div className="mt-4 flex flex-wrap gap-3.5">
                <Link
                  href={firstEp ? `/watch/series/${id}/${firstEp.id}` : `/watch/series/${id}`}
                  id="watch-series-btn"
                  className="flex items-center gap-2.5 rounded-2xl bg-[#00e599] px-7 py-3.5 font-display text-sm font-bold text-[#080a0a] shadow-[0_0_20px_rgba(0,229,153,0.4)] transition hover:bg-[#1df2ad] hover:scale-105 active:scale-95"
                >
                  <Play size={18} fill="currentColor" />
                  <span>1-qismni tomosha qilish</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes List & Interactive Client */}
      <div className="mt-8">
        <SeriesDetailClient
          id={id}
          title={mediaTitle(series)}
          episodes={episodes}
          initialComments={comments}
        />
      </div>
    </div>
  )
}
