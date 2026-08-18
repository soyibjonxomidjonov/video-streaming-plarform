'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Loader2, Film, Tv } from 'lucide-react'
import { api, unwrapList, type FavoriteItem, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import MediaCard from '@/components/media-card'

type TabValue = 'all' | 'movies' | 'series'

const TAB_LABELS: Record<TabValue, string> = {
  all: 'Barchasi',
  movies: 'Filmlar',
  series: 'Seriallar',
}

export default function FavoritesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [movieFavs, setMovieFavs] = useState<FavoriteItem[]>([])
  const [seriesFavs, setSeriesFavs] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabValue>('all')

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    let active = true
    async function loadFavs() {
      setLoading(true)
      try {
        const [mRes, sRes] = await Promise.allSettled([
          api.favoritesMovie(),
          api.favoritesSeries(),
        ])
        if (!active) return
        
        let mList = unwrapList(mRes.value)
        let sList = unwrapList(sRes.value)
        
        // Fetch detailed movie info using id__in filter
        const missingMovieIds = mList.filter(f => typeof f.movie === 'number').map(f => f.movie as number)
        if (missingMovieIds.length > 0) {
          try {
            const moviesData = await api.movies(`id__in=${missingMovieIds.join(',')}`)
            const movies = unwrapList(moviesData)
            mList = mList.map(f => {
              if (typeof f.movie === 'number') {
                const detail = movies.find(m => m.id === f.movie)
                if (detail) return { ...f, movie: detail }
              }
              return f
            })
          } catch { /* ignore */ }
        }
        
        // Fetch detailed series info using id__in filter
        const missingSeriesIds = sList.filter(f => typeof f.series === 'number').map(f => f.series as number)
        if (missingSeriesIds.length > 0) {
          try {
            const seriesData = await api.series(`id__in=${missingSeriesIds.join(',')}`)
            const series = unwrapList(seriesData)
            sList = sList.map(f => {
              if (typeof f.series === 'number') {
                const detail = series.find(s => s.id === f.series)
                if (detail) return { ...f, series: detail }
              }
              return f
            })
          } catch { /* ignore */ }
        }
        
        if (mRes.status === 'fulfilled') setMovieFavs(mList)
        if (sRes.status === 'fulfilled') setSeriesFavs(sList)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadFavs()
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
          <Bookmark size={32} aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-[#F8FAFC]">Mening ro&apos;yxatim</h1>
        <p className="mt-2 max-w-sm text-sm text-[#64748B]">
          Sevimli film va seriallaringizni saqlash va istalgan vaqt tomosha qilish uchun tizimga kiring.
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

  const movieItems: MediaItem[] = movieFavs
    .map((f) => {
      if (typeof f.movie === 'object' && f.movie !== null) return f.movie as MediaItem
      if (typeof f.movie === 'number') return { id: f.movie, title: 'Noma\'lum film' } as MediaItem
      return null
    })
    .filter((item): item is MediaItem => item !== null)

  const seriesItems: MediaItem[] = seriesFavs
    .map((f) => {
      if (typeof f.series === 'object' && f.series !== null) return f.series as MediaItem
      if (typeof f.series === 'number') return { id: f.series, title: 'Noma\'lum serial' } as MediaItem
      return null
    })
    .filter((item): item is MediaItem => item !== null)

  const showMovies = tab === 'all' || tab === 'movies'
  const showSeries = tab === 'all' || tab === 'series'
  const totalCount = movieItems.length + seriesItems.length

  return (
    <div className="w-full min-w-0">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00FFA3]">
            KUTUBXONA &amp; SAQLANGANLAR
          </p>
          <h1 className="font-display text-2xl font-black text-[#F8FAFC] sm:text-3xl">
            Mening ro&apos;yxatim{' '}
            <span className="text-[#00FFA3]">({totalCount})</span>
          </h1>
        </div>

        {/* Filter tabs — Bug 9: full keyboard + ARIA accessibility */}
        <div
          role="tablist"
          aria-label="Sevimlilar filtri"
          className="inline-flex p-1 rounded-2xl bg-[#0F171A] border border-[rgba(0,255,163,0.2)] gap-1"
        >
          {(['all', 'movies', 'series'] as const).map((t) => (
            <button
              key={t}
              id={`tab-${t}`}
              role="tab"
              aria-selected={tab === t}
              aria-controls={`tabpanel-${t}`}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-1 ${
                tab === t
                  ? 'bg-[#00FFA3] text-[#070A0C] shadow-[0_0_16px_rgba(0,255,163,0.35)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(255,255,255,0.05)]'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panel */}
      <div
        id={`tabpanel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
      >
        {loading ? (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            aria-busy="true"
            aria-label="Yuklanmoqda"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] rounded-2xl" aria-hidden="true" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,255,163,0.2)] bg-[#0F171A] py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[rgba(0,255,163,0.1)] text-[#00FFA3]">
              <Bookmark size={28} aria-hidden="true" />
            </div>
            <p className="mt-3 font-display text-lg font-bold text-[#F8FAFC]">
              Sevimlilar ro&apos;yxati hali bo&apos;sh
            </p>
            <p className="mt-1.5 text-sm text-[#64748B] max-w-sm">
              Yoqqan filmlarni ochib, &quot;+ Sevimlilarga&quot; tugmasini bosing yoki ovozli ayting.
            </p>
            <Link
              href="/movies"
              className="mt-4 text-sm font-bold text-[#00FFA3] hover:underline focus-visible:outline-2 focus-visible:outline-[#00FFA3] rounded-sm"
            >
              Katalogga o&apos;tish →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {showMovies && movieItems.length > 0 && (
              <section aria-labelledby="fav-movies-heading">
                {tab === 'all' && (
                  <h2 id="fav-movies-heading" className="mb-4 font-display text-lg font-bold text-[#F8FAFC]">
                    <Film size={18} className="inline mr-2 text-[#00FFA3]" aria-hidden="true" />
                    Filmlar ({movieItems.length})
                  </h2>
                )}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                  {movieItems.map((item) => (
                    <MediaCard key={item.id} item={item} type="movie" />
                  ))}
                </div>
              </section>
            )}

            {showSeries && seriesItems.length > 0 && (
              <section aria-labelledby="fav-series-heading">
                {tab === 'all' && (
                  <h2 id="fav-series-heading" className="mb-4 font-display text-lg font-bold text-[#F8FAFC]">
                    <Tv size={18} className="inline mr-2 text-[#00FFA3]" aria-hidden="true" />
                    Seriallar ({seriesItems.length})
                  </h2>
                )}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                  {seriesItems.map((item) => (
                    <MediaCard key={item.id} item={item} type="series" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
