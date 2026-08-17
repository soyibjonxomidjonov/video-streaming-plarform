'use client'

import React, { memo, useState } from 'react'
import Link from 'next/link'
import { Play, Plus, Check, Star, Sparkles, Film, Calendar, Clock } from 'lucide-react'
import { api, mediaImage, mediaRating, mediaYear, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

export const HeroBanner = memo(function HeroBanner({ movie }: { movie?: MediaItem | null }) {
  const { isAuthenticated } = useAuth()
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  const title = movie?.title || movie?.name || 'CYBER ELITES'
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
    <div className="min-h-[500px] lg:min-h-[580px] p-8 sm:p-12 lg:p-16 rounded-3xl relative overflow-hidden bg-gradient-to-r from-[#070A0C] via-[#0F171A]/95 to-transparent border border-[#00FFA3]/20 w-full mb-8 md:mb-12 flex items-center">
      {/* Backdrop */}
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdrop}
          alt={title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover opacity-25"
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070A0C] via-[#070A0C]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070A0C]/90 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col xl:grid xl:grid-cols-12 gap-8 w-full">
        {/* Left — Info */}
        <div className="flex flex-col gap-5 xl:col-span-8 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 rounded-xl border border-[rgba(0,255,163,0.35)] bg-[rgba(0,255,163,0.1)] px-4 py-2 text-sm font-bold uppercase tracking-widest text-[#00FFA3]">
              <Sparkles size={16} />
              {isSeries ? 'SERIAL' : 'PREMYERA FILM'}
            </span>
            <span className="flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#070A0C]/80 px-4 py-2 text-sm font-bold text-[#F59E0B]">
              <Star size={14} className="fill-[#F59E0B]" />
              {rating.toFixed(1)}
            </span>
            {year && (
              <span className="flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#070A0C]/60 px-4 py-2 text-sm text-[#94A3B8]">
                <Calendar size={14} />
                {year}
              </span>
            )}
            {movie?.duration_seconds && (
              <span className="flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#070A0C]/60 px-4 py-2 text-sm text-[#94A3B8]">
                <Clock size={14} />
                {Math.round(movie.duration_seconds / 60)} daq
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight mb-4">
            {title}
          </h1>

          {/* Description */}
          <p className="text-[#94A3B8] text-base sm:text-lg line-clamp-3 leading-relaxed max-w-2xl mb-4">
            {desc}
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={watchUrl}
              prefetch={true}
              className="h-16 px-10 text-lg font-extrabold bg-[#00FFA3] text-black rounded-2xl hover:shadow-[0_0_35px_rgba(0,255,163,0.6)] hover:scale-105 transition-all flex items-center gap-3"
            >
              <Play size={24} fill="currentColor" />
              HOZIR TOMOSHA QILISH
            </Link>

            <button
              onClick={handleAddToList}
              disabled={adding}
              className="h-16 px-8 text-base font-bold border-2 border-[#00FFA3]/40 bg-[#0F171A]/80 text-white rounded-2xl hover:bg-[#00FFA3]/20 transition-all flex items-center gap-3 disabled:opacity-60"
            >
              {added ? <Check size={20} className="text-[#00FFA3]" /> : <Plus size={20} />}
              {added ? "RO'YXATDA" : "+ SEVIMLILARGA QO'SHISH"}
            </button>
          </div>
        </div>

        {/* Right — Holo Card (xl+ only) */}
        <div className="hidden xl:flex xl:col-span-4 shrink-0 justify-end items-center">
          <div className="w-64 rounded-3xl border-2 border-[#00FFA3]/30 bg-gradient-to-br from-[#141F24] via-[#0F171A] to-[#070A0C] shadow-[0_0_50px_rgba(0,255,163,0.2)] flex flex-col items-center gap-5 p-8 transition-all duration-300 hover:border-[#00FFA3] hover:shadow-[0_0_60px_rgba(0,255,163,0.35)]">
            <div className="flex w-full items-center justify-between">
              <span className="rounded-full bg-[rgba(0,255,163,0.12)] border border-[#00FFA3]/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#00FFA3]">
                PREMYERA
              </span>
            </div>

            <div className="flex flex-col items-center gap-4 text-center w-full">
              <div className="flex size-20 items-center justify-center rounded-2xl border border-[rgba(0,255,163,0.3)] bg-[rgba(0,255,163,0.08)] text-[#00FFA3] shadow-[0_0_20px_rgba(0,255,163,0.2)]">
                <Film size={36} />
              </div>
              <div className="w-full">
                <h3 className="font-display text-base font-bold text-[#F8FAFC] line-clamp-2 px-1">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs text-[#64748B]">Ultra HD • AI Voice</p>
              </div>
            </div>

            <Link
              href={watchUrl}
              prefetch={true}
              className="w-full rounded-2xl bg-[#00FFA3] py-3.5 text-center text-sm font-bold uppercase tracking-wide text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.35)] transition hover:bg-[#1AFFA8] hover:scale-105 active:scale-95"
            >
              Hozir Tomosha Qilish
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
})

export default HeroBanner
