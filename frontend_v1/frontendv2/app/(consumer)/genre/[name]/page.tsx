'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Film, Loader2 } from 'lucide-react'
import { api, unwrapList, type MediaItem } from '@/lib/api'
import MediaCard from '@/components/media-card'

type Props = { params: Promise<{ name: string }> }

export default function GenreDetailPage({ params }: Props) {
  const { name } = use(params)
  const decodedName = decodeURIComponent(name)
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [series, setSeries] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [moviesData, seriesData] = await Promise.allSettled([
          api.movies(`genre_name=${encodeURIComponent(decodedName)}`),
          api.series(`genre_name=${encodeURIComponent(decodedName)}`),
        ])
        if (!active) return
        if (moviesData.status === 'fulfilled') setMovies(unwrapList(moviesData.value))
        if (seriesData.status === 'fulfilled') setSeries(unwrapList(seriesData.value))
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [decodedName])

  const total = movies.length + series.length

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <div className="h-3 w-32 rounded-full skeleton opacity-60" />
        <div className="h-10 w-64 rounded-xl skeleton" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] w-full rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0">
      {/* Breadcrumb + Header */}
      <div className="mb-8 flex flex-col gap-2">
        <Link
          href="/genres"
          aria-label="Barcha janrlar ro'yxatiga qaytish"
          className="flex w-fit items-center gap-1.5 text-xs font-medium text-[#64748B] transition hover:text-[#00FFA3] focus-visible:outline-2 focus-visible:outline-[#00FFA3] rounded-md"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Barcha janrlar
        </Link>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00FFA3]">
          JANR BO&apos;YICHA KONTENT
        </p>
        <h1 className="font-display text-2xl font-black text-[#F8FAFC] sm:text-3xl">
          {decodedName}
          {total > 0 && (
            <span className="ml-3 text-base font-semibold text-[#64748B]">({total} ta kontent)</span>
          )}
        </h1>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,255,163,0.2)] bg-[#0F171A] py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[rgba(0,255,163,0.1)] text-[#00FFA3] mb-3">
            <Film size={26} aria-hidden="true" />
          </div>
          <p className="font-display text-lg font-bold text-[#F8FAFC]">
            &quot;{decodedName}&quot; janrida kontent topilmadi
          </p>
          <Link
            href="/movies"
            className="mt-4 text-sm font-bold text-[#00FFA3] hover:underline focus-visible:outline-2 focus-visible:outline-[#00FFA3] rounded-sm"
          >
            Barcha filmlarni ko&apos;rish &rarr;
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {movies.length > 0 && (
            <section aria-labelledby="genre-movies-heading">
              <h2
                id="genre-movies-heading"
                className="mb-5 font-display text-xl font-bold text-[#F8FAFC] flex items-center gap-2"
              >
                <Film size={18} className="text-[#00FFA3]" aria-hidden="true" />
                Filmlar ({movies.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                {movies.map((movie) => (
                  <MediaCard key={movie.id} item={movie} type="movie" />
                ))}
              </div>
            </section>
          )}

          {series.length > 0 && (
            <section aria-labelledby="genre-series-heading">
              <h2
                id="genre-series-heading"
                className="mb-5 font-display text-xl font-bold text-[#F8FAFC] flex items-center gap-2"
              >
                Seriallar ({series.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                {series.map((item) => (
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
