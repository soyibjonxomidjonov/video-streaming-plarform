'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Play, Trash2, Film, Loader2 } from 'lucide-react'
import { api, mediaImage, mediaTitle, unwrapList, type WatchProgress, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

function formatSeconds(seconds?: number): string {
  if (!seconds) return '0 daq'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}s ${minutes}d`
  return `${minutes} daqiqa`
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
        if (mRes.status === 'fulfilled') setMovieHistory(unwrapList(mRes.value))
        if (sRes.status === 'fulfilled') setSeriesHistory(unwrapList(sRes.value))
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadHistory()
    return () => { active = false }
  }, [isAuthenticated])

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#00e599]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,229,153,0.2)] bg-[#101514] py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[rgba(0,229,153,0.1)] text-[#00e599]">
            <Clock size={32} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[#f5f7f6]">Tomosha Tarixi</h1>
          <p className="mt-2 max-w-sm text-sm text-[#8c9994]">
            Ko&apos;rgan filmlaringizni eslab qolish va to'xtatilgan vaqtdan davom ettirish uchun tizimga kiring.
          </p>
          <Link
            href="/login"
            className="mt-6 rounded-2xl bg-[#00e599] px-7 py-3 text-xs font-bold text-[#080a0a] shadow-[0_0_20px_rgba(0,229,153,0.4)] transition hover:bg-[#1df2ad] hover:scale-105"
          >
            Tizimga kirish
          </Link>
        </div>
      </div>
    )
  }

  const allHistory = [
    ...movieHistory.map((h) => ({ ...h, type: 'movie' as const, item: typeof h.movie === 'object' ? h.movie : null })),
    ...seriesHistory.map((h) => ({ ...h, type: 'series' as const, item: typeof h.episode === 'object' ? (h.episode?.series || h.episode) : null })),
  ].filter((h) => h.item)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00e599]">
          DAVOM ETTIRISH & TARIX
        </p>
        <h1 className="font-display text-2xl font-black text-[#f5f7f6] sm:text-3xl">
          Tomosha Tarixi
        </h1>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : allHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,229,153,0.2)] bg-[#101514] py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[rgba(0,229,153,0.1)] text-[#00e599]">
            <Clock size={28} />
          </div>
          <p className="mt-3 font-display text-lg font-bold text-[#f5f7f6]">Tomosha tarixi bo&apos;sh</p>
          <p className="mt-1 text-xs text-[#8c9994]">Siz hali birorta ham film yoki serial tomosha qilmadingiz.</p>
          <Link href="/movies" className="mt-4 text-xs font-bold text-[#00e599] hover:underline">
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
                className="group flex items-center gap-3.5 rounded-2xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-3 transition hover:border-[#00e599] hover:bg-[#161f1c]"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl bg-[#161f1c]">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={title} className="size-full object-cover group-hover:scale-108 transition duration-300" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                    <Play size={18} fill="currentColor" className="text-[#00e599]" />
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00e599]">
                    {record.type === 'series' ? 'Serial' : 'Film'}
                  </span>
                  <h3 className="truncate font-display text-sm font-bold text-[#f5f7f6] group-hover:text-[#00e599] transition">{title}</h3>
                  {record.position_seconds > 0 && (
                    <p className="mt-1 text-xs text-[#8c9994]">
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
