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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#00e599]" size={36} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/movies"
          className="flex w-fit items-center gap-1.5 text-xs text-[#8c9994] transition hover:text-[#00e599]"
        >
          <ArrowLeft size={14} /> Barcha filmlar
        </Link>
        <p className="text-xs font-bold uppercase tracking-widest text-[#00e599]">
          JANR BO'YICHA KONTENT
        </p>
        <h1 className="font-display text-2xl font-black text-[#f5f7f6] sm:text-3xl">
          {decodedName}
        </h1>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,229,153,0.2)] bg-[#101514] py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[rgba(0,229,153,0.1)] text-[#00e599]">
            <Film size={26} />
          </div>
          <p className="mt-3 font-display text-lg font-bold text-[#f5f7f6]">
            &quot;{decodedName}&quot; janrida kontent topilmadi
          </p>
          <Link href="/movies" className="mt-4 text-xs font-bold text-[#00e599] hover:underline">
            Barcha filmlarni ko&apos;rish →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {movies.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-bold text-[#f5f7f6]">
                Filmlar ({movies.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {movies.map((movie) => (
                  <MediaCard key={movie.id} item={movie} type="movie" />
                ))}
              </div>
            </section>
          )}

          {series.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-bold text-[#f5f7f6]">
                Seriallar ({series.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
