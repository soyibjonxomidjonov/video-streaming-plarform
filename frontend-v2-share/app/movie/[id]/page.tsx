'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Play, Star, Sparkles, Film } from 'lucide-react'
import { api, mediaDescription, mediaImage, mediaRating, mediaTitle, mediaYear, unwrapList, type MediaItem, type Comment } from '@/lib/api'
import MovieDetailClient from './movie-detail-client'

type Props = { params: Promise<{ id: string }> }

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours} soat ${minutes} daqiqa`
  return `${minutes} daqiqa`
}

function MovieDetailSkeleton() {
  return (
    <div className="animate-pulse w-full flex flex-col gap-6">
      <div className="h-4 w-32 rounded bg-[#161f1c]" />
      <div className="min-h-[420px] rounded-3xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-8 flex flex-col sm:flex-row gap-8 items-center">
        <div className="w-48 aspect-[2/3] rounded-2xl bg-[#161f1c]" />
        <div className="flex-1 flex flex-col gap-4 w-full">
          <div className="h-6 w-24 rounded bg-[rgba(0,229,153,0.15)]" />
          <div className="h-10 w-2/3 rounded-xl bg-[rgba(255,255,255,0.08)]" />
          <div className="h-4 w-full rounded bg-[rgba(255,255,255,0.05)]" />
          <div className="h-12 w-44 rounded-2xl bg-[#00e599]/30 mt-4" />
        </div>
      </div>
    </div>
  )
}

export default function MovieDetailPage({ params }: Props) {
  const { id } = use(params)
  const [movie, setMovie] = useState<MediaItem | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [mRes, cRes] = await Promise.allSettled([
          api.movie(id),
          api.movieComments(id),
        ])
        if (!active) return
        if (mRes.status === 'fulfilled') setMovie(mRes.value)
        if (cRes.status === 'fulfilled') setComments(unwrapList(cRes.value))
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [id])

  if (loading && !movie) {
    return <MovieDetailSkeleton />
  }

  if (!movie) {
    return (
      <div className="p-8 text-center bg-[#101514] rounded-3xl border border-[rgba(0,229,153,0.15)]">
        <Film size={40} className="mx-auto text-[#00e599] mb-3" />
        <h2 className="text-xl font-bold text-[#f5f7f6]">Film topilmadi</h2>
        <Link href="/movies" prefetch={true} className="mt-4 inline-block text-xs font-bold text-[#00e599] hover:underline">
          ← Barcha filmlarga qaytish
        </Link>
      </div>
    )
  }

  const image = mediaImage(movie)
  const backdrop = mediaImage(movie, 'backdrop')
  const rating = mediaRating(movie) ?? 4.8
  const year = mediaYear(movie)
  const duration = movie.duration_seconds
  const streamUrl = api.movieStream(id)

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Back Link */}
      <Link
        href="/movies"
        prefetch={true}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8c9994] transition hover:text-[#00e599] w-fit"
      >
        <ArrowLeft size={15} /> Filmlarga qaytish
      </Link>

      {/* HERO DETAIL CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(0,229,153,0.25)] bg-gradient-to-r from-[#0c1311] via-[#101916] to-[#080a0a] p-6 sm:p-10 lg:p-12 shadow-[0_0_35px_rgba(0,229,153,0.1)]">
        {/* Backdrop Ambient Image */}
        {backdrop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backdrop}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25"
          />
        )}
        <div className="absolute right-0 top-0 bottom-0 w-2/3 bg-gradient-to-l from-[#00e599]/10 via-[#0d4d38]/15 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080a0a] via-[#080a0a]/80 to-transparent pointer-events-none" />

        {/* Content flex row */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
          {/* Poster Box */}
          <div className="w-48 sm:w-56 md:w-64 shrink-0">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl border border-[rgba(0,229,153,0.3)] bg-[#161f1c] shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,153,0.2)]">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={mediaTitle(movie)} className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center bg-gradient-to-b from-[#161f1c] to-[#080a0a]">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-[rgba(0,229,153,0.15)] text-[#00e599] border border-[#00e599]/30">
                    <Film size={28} />
                  </div>
                  <span className="font-display text-sm font-bold text-[#f5f7f6] line-clamp-2">{mediaTitle(movie)}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#00e599] font-bold">PREMYERA HD</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Details */}
          <div className="flex-1 flex flex-col gap-4 text-center sm:text-left">
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <span className="flex items-center gap-1 rounded-full border border-[rgba(0,229,153,0.3)] bg-[#00e599]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#00e599]">
                <Sparkles size={12} /> Film HD
              </span>

              <div className="flex items-center gap-1 rounded-full bg-[#080a0a]/80 border border-white/10 px-3 py-1 text-xs font-bold text-yellow-400">
                <span>★ ★ ★ ★ ★</span>
                <span className="text-white/70 ml-1">({rating.toFixed(1)})</span>
              </div>

              {year && (
                <span className="flex items-center gap-1 text-xs font-bold text-[#8c9994] bg-[#161f1c] px-2.5 py-1 rounded-full border border-white/5">
                  <Calendar size={13} /> {year}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1 text-xs font-bold text-[#8c9994] bg-[#161f1c] px-2.5 py-1 rounded-full border border-white/5">
                  <Clock size={13} /> {formatDuration(duration)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#f5f7f6]">
              {mediaTitle(movie)}
            </h1>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {movie.genres.map((g, idx) => {
                  const genreName = typeof g === 'object' ? g.name : String(g)
                  return (
                    <Link
                      key={`genre-${idx}`}
                      href={`/genre/${encodeURIComponent(genreName)}`}
                      prefetch={true}
                      className="rounded-xl border border-[rgba(0,229,153,0.2)] bg-[rgba(0,229,153,0.08)] px-3 py-1 text-xs font-bold text-[#00e599] transition hover:bg-[rgba(0,229,153,0.2)]"
                    >
                      {genreName}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Description */}
            <p className="text-sm md:text-base leading-relaxed text-[#8c9994] max-w-2xl">
              {mediaDescription(movie) || "Ushbu film haqida to'liq ma'lumot tez orada taqdim etiladi. Yuqori sifatda tomosha qiling."}
            </p>

            {/* Watch CTA */}
            <div className="pt-3 flex flex-wrap justify-center sm:justify-start gap-4">
              <Link
                href={`/watch/movie/${id}`}
                prefetch={true}
                id="watch-movie-btn"
                className="flex items-center gap-2.5 rounded-2xl bg-[#00e599] hover:bg-[#1df2ad] px-8 py-4 font-display text-sm font-bold text-[#080a0a] shadow-[0_0_25px_rgba(0,229,153,0.45)] transition hover:scale-105 active:scale-95"
              >
                <Play size={20} fill="currentColor" />
                <span>Tomosha qilish</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Rating & Comments */}
      <div className="w-full">
        <MovieDetailClient
          id={id}
          type="movie"
          streamUrl={streamUrl}
          title={mediaTitle(movie)}
          initialComments={comments}
        />
      </div>
    </div>
  )
}
