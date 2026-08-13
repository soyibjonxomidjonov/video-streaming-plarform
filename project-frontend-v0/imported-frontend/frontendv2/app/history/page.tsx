'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Play, Trash2 } from 'lucide-react'
import { api, mediaImage, mediaTitle, unwrapList, type WatchProgress, formatDuration } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import AppChrome from '@/components/app-chrome'

export default function HistoryPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [movieHistory, setMovieHistory] = useState<WatchProgress[]>([])
  const [seriesHistory, setSeriesHistory] = useState<WatchProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    async function loadHistory() {
      setLoading(true)
      try {
        const [mRes, sRes] = await Promise.allSettled([
          api.movieProgress(),
          api.seriesProgress(),
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

  if (!isAuthenticated && !authLoading) {
    return (
      <AppChrome>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20 text-center">
          <Clock size={40} className="mb-3 text-muted-foreground/50" />
          <h1 className="font-display text-2xl font-bold">Tomosha Tarixi</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Ko&apos;rgan filmlaringiz va qolgan joyidan davom ettirish uchun tizimga kiring.
          </p>
          <Link href="/login" className="mt-5 rounded-xl px-6 py-3 text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}>
            Tizimga kirish
          </Link>
        </div>
      </AppChrome>
    )
  }

  const allHistory = [
    ...movieHistory.map(h => ({ ...h, type: 'movie' as const, item: h.movie })),
    ...seriesHistory.map(h => ({ ...h, type: 'series' as const, item: h.episode?.series ?? h.episode })),
  ].filter(h => h.item)

  return (
    <AppChrome>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
            Kutubxona
          </p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Tomosha Tarixi</h1>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : allHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center">
          <Clock size={36} className="mb-2 text-muted-foreground/40" />
          <p className="font-display text-lg font-bold">Tomosha tarixi bo&apos;sh</p>
          <p className="mt-1 text-sm text-muted-foreground">Siz hali birorta ham video ko&apos;rmadingiz</p>
          <Link href="/movies" className="mt-4 text-sm font-semibold" style={{ color: '#f5a623' }}>
            Kino ko&apos;rishni boshlash →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allHistory.map(record => {
            const media = record.item
            if (!media) return null
            const title = mediaTitle(media)
            const img = mediaImage(media)
            const href = record.type === 'movie'
              ? `/watch/movie/${media.id}`
              : `/watch/series/${media.id}`

            return (
              <Link
                key={`${record.type}-${record.id}`}
                href={href}
                className="group flex items-center gap-3.5 rounded-2xl p-3 transition hover:border-amber-400/50"
                style={{ background: '#16161a', border: '1px solid #2a2a30' }}
              >
                {/* Poster / Thumbnail */}
                <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={title} className="size-full object-cover group-hover:scale-105 transition" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                    <Play size={16} fill="white" className="text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {record.type === 'series' ? 'Serial' : 'Film'}
                  </span>
                  <h3 className="truncate text-sm font-semibold group-hover:text-amber-400 transition">{title}</h3>
                  {record.position_seconds > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDuration(record.position_seconds)} ko&apos;rilgan
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </AppChrome>
  )
}
