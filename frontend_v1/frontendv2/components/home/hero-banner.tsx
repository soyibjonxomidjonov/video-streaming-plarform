'use client'

import React, { memo, useState } from 'react'
import Link from 'next/link'
import { Play, Plus, Check, Star, Sparkles, Calendar, Clock } from 'lucide-react'
import { api, mediaImage, mediaRating, mediaYear, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

export const HeroBanner = memo(function HeroBanner({ movie }: { movie?: MediaItem | null }) {
  const { isAuthenticated } = useAuth()
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  const title = movie?.title || movie?.name || 'SM STREAM'
  const desc =
    movie?.description ||
    movie?.overview ||
    'Kelajak texnologiyalari va kiber olam qahramonlari haqidagi premyera film. Ultra HD va AI ovozli boshqaruv bilan tomosha qiling.'
  const rating = movie ? (mediaRating(movie) ?? 4.9) : 4.9
  const backdrop = movie ? mediaImage(movie, 'backdrop') : ''
  const year = movie ? mediaYear(movie) : '2026'
  const isSeries =
    movie?.type === 'series' || (movie && !movie.duration_seconds && !movie.duration)
  const watchUrl = movie?.id ? `/watch/${isSeries ? 'series' : 'movie'}/${movie.id}` : '/movies'
  const detailUrl = movie?.id ? `/${isSeries ? 'series' : 'movie'}/${movie.id}` : '/movies'

  const handleAddToList = async () => {
    if (!movie?.id || !isAuthenticated) return
    setAdding(true)
    try {
      if (isSeries) await api.addFavoriteSeries(movie.id)
      else await api.addFavoriteMovie(movie.id)
      setAdded(true)
    } catch {
      setAdded(true)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden flex items-end"
      style={{ minHeight: 'min(82vh, 900px)', padding: 'clamp(2rem, 5vw, 6rem)' }}
    >
      {/* ── Background: Movie poster OR premium CSS fallback ── */}
      {backdrop ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdrop}
          alt={title}
          loading="eager"
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: 'center 20%' }}
        />
      ) : (
        /* Premium CSS animated background — rasm yo'q bo'lganda */
        <div className="absolute inset-0 hero-bg-fallback" aria-hidden="true">
          {/* Base dark */}
          <div className="absolute inset-0 bg-[#050709]" />

          {/* Animated radial light sources */}
          <div className="absolute inset-0 hero-orb-1" />
          <div className="absolute inset-0 hero-orb-2" />
          <div className="absolute inset-0 hero-orb-3" />

          {/* Grid lines — depth effect */}
          <div className="absolute inset-0 hero-grid" />

          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          />

          {/* Horizontal scan lines */}
          <div className="absolute inset-0 hero-scanlines" />
        </div>
      )}

      {/* ── Cinematic Overlays ── */}
      {/* Left fade — text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050709] via-[#050709]/75 to-transparent pointer-events-none" />
      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070A0C] via-[#070A0C]/30 to-transparent pointer-events-none" />
      {/* Top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070A0C]/40 to-transparent pointer-events-none" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col gap-6 sm:gap-8 max-w-4xl w-full">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2.5" aria-label="Film ma'lumotlari">
          <span className="flex items-center gap-1.5 rounded-full bg-[rgba(0,255,163,0.15)] backdrop-blur-md border border-[rgba(0,255,163,0.3)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#00FFA3]">
            <Sparkles size={12} aria-hidden="true" />
            {isSeries ? 'SERIAL' : 'PREMYERA'}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-4 py-1.5 text-xs font-bold text-[#F59E0B]">
            <Star size={12} className="fill-[#F59E0B]" aria-hidden="true" />
            <span aria-label={`Reyting ${rating.toFixed(1)}`}>{rating.toFixed(1)}</span>
          </span>
          {year && (
            <span className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-4 py-1.5 text-xs font-medium text-zinc-300">
              <Calendar size={12} aria-hidden="true" />
              {year}
            </span>
          )}
          {movie?.duration_seconds && (
            <span className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-4 py-1.5 text-xs font-medium text-zinc-300">
              <Clock size={12} aria-hidden="true" />
              {Math.round(movie.duration_seconds / 60)} daq
            </span>
          )}
        </div>

        {/* Title — fluid typography */}
        <h1
          className="font-display font-black text-white tracking-tight leading-[1.02] drop-shadow-2xl text-balance"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
        >
          {title}
        </h1>

        {/* Description */}
        <p
          className="text-zinc-300 max-w-2xl leading-relaxed line-clamp-3 drop-shadow-lg font-medium"
          style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.25rem)' }}
        >
          {desc}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-4 mt-2">
          {/* Primary CTA */}
          <Link
            href={watchUrl}
            prefetch={true}
            aria-label={`${title} — tomosha qilish`}
            className="group relative inline-flex h-14 sm:h-16 items-center justify-center gap-3 overflow-hidden rounded-full bg-[#00FFA3] px-8 sm:px-10 text-base sm:text-lg font-bold text-[#070A0C] transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,255,163,0.35)] hover:shadow-[0_0_60px_rgba(0,255,163,0.55)] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            {/* Shine sweep on hover */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" aria-hidden="true" />
            <Play size={22} fill="currentColor" className="transition-transform group-hover:scale-110 relative" aria-hidden="true" />
            <span className="relative">Tomosha qilish</span>
          </Link>

          {/* Secondary CTA */}
          <Link
            href={detailUrl}
            prefetch={true}
            aria-label={`${title} — batafsil ma'lumot`}
            className="inline-flex h-14 sm:h-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-8 sm:px-10 text-base sm:text-lg font-bold text-white transition-all hover:bg-white/20 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2"
          >
            Batafsil ma&apos;lumot
          </Link>

          {/* Add to list */}
          {isAuthenticated && (
            <button
              onClick={handleAddToList}
              disabled={adding}
              aria-label={added ? "Ro'yxatga qo'shilgan" : "Ro'yxatga qo'shish"}
              aria-pressed={added}
              className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 font-bold text-zinc-300 transition-all hover:bg-black/70 hover:text-white hover:scale-105 active:scale-95 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2"
            >
              {added
                ? <Check size={22} className="text-[#00FFA3]" aria-hidden="true" />
                : <Plus size={22} aria-hidden="true" />
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
