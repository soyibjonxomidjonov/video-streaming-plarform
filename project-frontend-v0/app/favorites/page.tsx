'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Loader2 } from 'lucide-react'
import { api, unwrapList, type FavoriteItem, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import AppChrome from '@/components/app-chrome'
import MediaCard from '@/components/media-card'

export default function FavoritesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [movieFavs, setMovieFavs] = useState<FavoriteItem[]>([])
  const [seriesFavs, setSeriesFavs] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'movies' | 'series'>('all')

  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    async function loadFavs() {
      setLoading(true)
      try {
        const [mRes, sRes] = await Promise.allSettled([
          api.movieFavorites(),
          api.seriesFavorites(),
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
      <AppChrome>
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" style={{ color: '#f5a623' }} />
        </div>
      </AppChrome>
    )
  }

  if (!isAuthenticated) {
    return (
      <AppChrome>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20 text-center">
          <Heart size={40} className="mb-3 text-muted-foreground/50" />
          <h1 className="font-display text-2xl font-bold">Sevimlilar ro&apos;yxati</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Sevimli film va seriallaringizni saqlash uchun tizimga kiring.
          </p>
          <Link
            href="/login"
            className="mt-5 rounded-xl px-6 py-3 text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
          >
            Tizimga kirish
          </Link>
        </div>
      </AppChrome>
    )
  }

  // Flatten media items from favorite items
  const movieItems: MediaItem[] = movieFavs
    .map(f => f.movie ?? (f as unknown as MediaItem))
    .filter(Boolean)
  const seriesItems: MediaItem[] = seriesFavs
    .map(f => f.series ?? (f as unknown as MediaItem))
    .filter(Boolean)

  const showMovies = tab === 'all' || tab === 'movies'
  const showSeries = tab === 'all' || tab === 'series'
  const totalCount = movieItems.length + seriesItems.length

  return (
    <AppChrome>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
            Kutubxona
          </p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Mening Sevimlilarim</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex w-full gap-1 rounded-xl p-1 sm:w-auto" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
          {(['all', 'movies', 'series'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold capitalize transition sm:flex-none sm:px-4 sm:py-1.5"
              style={
                tab === t
                  ? { background: '#f5a623', color: '#0a0a0c' }
                  : { color: '#9a9aa2' }
              }
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
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center">
          <Heart size={36} className="mb-2 text-muted-foreground/40" />
          <p className="font-display text-lg font-bold">Sevimlilar ro&apos;yxati bo&apos;sh</p>
          <p className="mt-1 text-sm text-muted-foreground">Yoqqan film va seriallarda yurakcha tugmasini bosing</p>
          <Link href="/movies" className="mt-4 text-sm font-semibold" style={{ color: '#f5a623' }}>
            Katalogga o&apos;tish →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {showMovies && movieItems.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="mb-4 font-display text-lg font-bold">Filmlar ({movieItems.length})</h2>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {movieItems.map(item => (
                  <MediaCard key={item.id} item={item} type="movie" />
                ))}
              </div>
            </section>
          )}

          {showSeries && seriesItems.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="mb-4 font-display text-lg font-bold">Seriallar ({seriesItems.length})</h2>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {seriesItems.map(item => (
                  <MediaCard key={item.id} item={item} type="series" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppChrome>
  )
}
