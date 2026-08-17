'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Loader2, Film, Tv } from 'lucide-react'
import { api, unwrapList, type FavoriteItem, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import MediaCard from '@/components/media-card'

export default function FavoritesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [movieFavs, setMovieFavs] = useState<FavoriteItem[]>([])
  const [seriesFavs, setSeriesFavs] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'movies' | 'series'>('all')

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
        if (mRes.status === 'fulfilled') setMovieFavs(unwrapList(mRes.value))
        if (sRes.status === 'fulfilled') setSeriesFavs(unwrapList(sRes.value))
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadFavs()
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
            <Bookmark size={32} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[#f5f7f6]">Mening ro&apos;yxatim</h1>
          <p className="mt-2 max-w-sm text-sm text-[#8c9994]">
            Sevimli film va seriallaringizni saqlash va istalgan vaqt tomosha qilish uchun tizimga kiring.
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

  const movieItems: MediaItem[] = movieFavs
    .map((f) => (typeof f.movie === 'object' ? f.movie : (f as unknown as MediaItem)))
    .filter(Boolean)
  const seriesItems: MediaItem[] = seriesFavs
    .map((f) => (typeof f.series === 'object' ? f.series : (f as unknown as MediaItem)))
    .filter(Boolean)

  const showMovies = tab === 'all' || tab === 'movies'
  const showSeries = tab === 'all' || tab === 'series'
  const totalCount = movieItems.length + seriesItems.length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00e599]">
            KUTUBXONA & SAQLANGANLAR
          </p>
          <h1 className="font-display text-2xl font-black text-[#f5f7f6] sm:text-3xl">
            Mening ro&apos;yxatim (Sevimlilar)
          </h1>
        </div>

        {/* Filter tabs */}
        <div className="inline-flex p-1.5 rounded-2xl bg-[#0F171A] border border-[#00FFA3]/20 backdrop-blur-md gap-2">
          {(['all', 'movies', 'series'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 ${
                tab === t
                  ? "bg-[#00FFA3] text-black shadow-[0_0_20px_rgba(0,255,163,0.4)] scale-105"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {t === 'all' ? 'Barchasi' : t === 'movies' ? 'Filmlar' : 'Seriallar'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,229,153,0.2)] bg-[#101514] py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[rgba(0,229,153,0.1)] text-[#00e599]">
            <Bookmark size={28} />
          </div>
          <p className="mt-3 font-display text-lg font-bold text-[#f5f7f6]">
            Sevimlilar ro&apos;yxati hali bo&apos;sh
          </p>
          <p className="mt-1 text-xs text-[#8c9994]">
            Yoqqan filmlarni ochib, "+ Sevimlilarga" tugmasini bosing yoki ovozli ayting: "buni sevimlilarga qo'sh".
          </p>
          <Link
            href="/movies"
            className="mt-4 text-xs font-bold text-[#00e599] hover:underline"
          >
            Katalogga o&apos;tish →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {showMovies && movieItems.length > 0 && (
            <section>
              {tab === 'all' && (
                <h2 className="mb-4 font-display text-lg font-bold text-[#f5f7f6]">
                  Filmlar ({movieItems.length})
                </h2>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {movieItems.map((item) => (
                  <MediaCard key={item.id} item={item} type="movie" />
                ))}
              </div>
            </section>
          )}

          {showSeries && seriesItems.length > 0 && (
            <section>
              {tab === 'all' && (
                <h2 className="mb-4 font-display text-lg font-bold text-[#f5f7f6]">
                  Seriallar ({seriesItems.length})
                </h2>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {seriesItems.map((item) => (
                  <MediaCard key={item.id} item={item} type="series" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
