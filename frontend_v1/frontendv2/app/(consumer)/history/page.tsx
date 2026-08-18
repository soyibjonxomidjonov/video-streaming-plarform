'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Play, Film, Loader2 } from 'lucide-react'
import { api, mediaImage, mediaTitle, unwrapList, type WatchProgress, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

function formatSeconds(seconds?: number): string {
  if (!seconds) return '0 daq'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0 && minutes > 0) return `${hours} soat ${minutes} daq`
  if (hours > 0) return `${hours} soat`
  return `${minutes} daq`
}

export default function HistoryPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [movieHistory, setMovieHistory] = useState<WatchProgress[]>([])
  const [seriesHistory, setSeriesHistory] = useState<WatchProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    let active = true
    async function loadHistory() {
      setLoading(true)
      try {
        const [mRes, sRes] = await Promise.allSettled([
          api.historyMovie(),
          api.historySeries(),
        ])
        if (!active) return
        
        let mList = unwrapList(mRes.value)
        let sList = unwrapList(sRes.value)
        
        // Fetch detailed movie info using id__in filter
        const missingMovieIds = mList.filter(h => typeof h.movie === 'number').map(h => h.movie as number)
        if (missingMovieIds.length > 0) {
          try {
            const moviesData = await api.movies(`id__in=${missingMovieIds.join(',')}`)
            const movies = unwrapList(moviesData)
            mList = mList.map(h => {
              if (typeof h.movie === 'number') {
                const detail = movies.find(m => m.id === h.movie)
                if (detail) return { ...h, movie: detail }
              }
              return h
            })
          } catch { /* ignore */ }
        }
        
        // Fetch detailed series info using id__in filter (history stores episode ID)
        const missingEpisodeIds = sList.filter(h => typeof h.episode === 'number').map(h => h.episode as number)
        if (missingEpisodeIds.length > 0) {
          try {
            const episodesData = await api.episodes(`id__in=${missingEpisodeIds.join(',')}`)
            const episodes = unwrapList(episodesData)
            sList = sList.map(h => {
              if (typeof h.episode === 'number') {
                const detail = episodes.find(e => e.id === h.episode)
                if (detail) return { ...h, episode: detail }
              }
              return h
            })
          } catch { /* ignore */ }
        }
        
        if (mRes.status === 'fulfilled') setMovieHistory(mList)
        if (sRes.status === 'fulfilled') setSeriesHistory(sList)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadHistory()
    return () => { active = false }
  }, [isAuthenticated])

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center" aria-live="polite" aria-label="Yuklanmoqda">
        <Loader2 size={36} className="animate-spin text-[#00FFA3]" aria-hidden="true" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,255,163,0.2)] bg-[#0F171A] py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[rgba(0,255,163,0.1)] text-[#00FFA3]">
          <Clock size={32} aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-[#F8FAFC]">Tomosha Tarixi</h1>
        <p className="mt-2 max-w-sm text-sm text-[#64748B]">
          Ko&apos;rgan filmlaringizni eslab qolish va to&apos;xtatilgan vaqtdan davom ettirish uchun tizimga kiring.
        </p>
        <Link
          href="/login"
          className="mt-6 rounded-2xl bg-[#00FFA3] px-7 py-3 text-sm font-bold text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.4)] transition hover:bg-[#1AFFA8] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2"
        >
          Tizimga kirish
        </Link>
      </div>
    )
  }

  const allHistory = [
    ...movieHistory.map((h) => {
      let item: MediaItem | null = null
      if (typeof h.movie === 'object' && h.movie !== null) item = h.movie
      else if (typeof h.movie === 'number') item = { id: h.movie, title: 'Noma\'lum film' } as MediaItem

      return { ...h, type: 'movie' as const, item }
    }),
    ...seriesHistory.map((h) => {
      let item: MediaItem | null = null
      if (typeof h.episode === 'object' && h.episode !== null) item = h.episode?.series || h.episode
      else if (typeof h.episode === 'number') item = { id: h.episode, title: 'Noma\'lum serial' } as MediaItem

      return { ...h, type: 'series' as const, item }
    }),
  ].filter((h) => h.item)

  return (
    <div className="w-full min-w-0">
      {/* Page Header */}
      <div className="mb-6">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00FFA3]">
          DAVOM ETTIRISH &amp; TARIX
        </p>
        <h1 className="font-display text-2xl font-black text-[#F8FAFC] sm:text-3xl">
          Tomosha Tarixi
        </h1>
      </div>

      {loading ? (
        // Skeleton — haqiqiy karta o'lchamiga mos (h-[88px] = thumbnail 56px + padding)
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Yuklanmoqda">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[88px] rounded-2xl" />
          ))}
        </div>
      ) : allHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,255,163,0.2)] bg-[#0F171A] py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[rgba(0,255,163,0.1)] text-[#00FFA3]">
            <Clock size={28} aria-hidden="true" />
          </div>
          <p className="mt-3 font-display text-lg font-bold text-[#F8FAFC]">Tomosha tarixi bo&apos;sh</p>
          <p className="mt-1.5 text-sm text-[#64748B] max-w-sm">
            Siz hali birorta ham film yoki serial tomosha qilmadingiz.
          </p>
          <Link
            href="/movies"
            className="mt-4 text-sm font-bold text-[#00FFA3] hover:underline focus-visible:outline-2 focus-visible:outline-[#00FFA3] rounded-sm"
          >
            Kino ko&apos;rishni boshlash →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {allHistory.map((record, idx) => {
            const media = record.item as MediaItem
            if (!media) return null
            const title = mediaTitle(media)
            const img = mediaImage(media)
            const href = record.type === 'movie'
              ? `/watch/movie/${media.id}`
              : `/watch/series/${media.id}`

            return (
              <Link
                key={`${record.type}-${record.id || idx}`}
                href={href}
                aria-label={`${title} — davom ettirish`}
                className="group flex items-center gap-3.5 rounded-2xl border border-[rgba(0,255,163,0.12)] bg-[#0F171A] p-3 transition hover:border-[rgba(0,255,163,0.4)] hover:bg-[#141F24] focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2"
              >
                {/* Thumbnail — aspect-video, fixed width */}
                <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl bg-[#141F24]">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={`${title} muqovasi`}
                      className="size-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center" aria-hidden="true">
                      <Film size={20} className="text-[#4B5563]" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition duration-200" aria-hidden="true">
                    <Play size={18} fill="currentColor" className="text-[#00FFA3]" />
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00FFA3]">
                    {record.type === 'series' ? 'Serial' : 'Film'}
                  </span>
                  <h3 className="truncate font-display text-sm font-bold text-zinc-100 group-hover:text-[#00FFA3] transition duration-200">
                    {title}
                  </h3>
                  {record.position_seconds > 0 && (
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      {formatSeconds(record.position_seconds)} ko&apos;rildi
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
