'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { SearchX, SlidersHorizontal, Loader2 } from 'lucide-react'
import { api, unwrapList, type Genre, type MediaItem } from '@/lib/api'
import MediaCard from '@/components/media-card'

type SearchParams = { q?: string; genre?: string; type?: string; page?: string; sort?: string }

export default function ExplorePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = use(searchParams)
  const query = params.q ?? ''
  const genre = params.genre ?? ''
  const type = (params.type === 'series' ? 'series' : 'movie') as 'movie' | 'series'
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const sort = params.sort ?? '-created_at'

  const [items, setItems] = useState<MediaItem[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const filterParams = new URLSearchParams({ ordering: sort, page: String(page) })
        if (genre) filterParams.set('genre', genre)
        const [data, genreData] = await Promise.allSettled([
          query
            ? (type === 'series' ? api.series(`search=${query}`) : api.movies(`search=${query}`))
            : type === 'series' ? api.series(filterParams.toString()) : api.movies(filterParams.toString()),
          api.genres(),
        ])
        if (!active) return
        if (data.status === 'fulfilled') setItems(unwrapList(data.value))
        if (genreData.status === 'fulfilled') setGenres(unwrapList(genreData.value))
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [query, genre, type, page, sort])

  return (
    <div className="w-full min-w-0">
      <header className="mb-6 flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00FFA3]">
          KASHF ETISH VA FILTRLAR
        </p>
        <h1 className="font-display text-2xl font-black text-[#F8FAFC] sm:text-3xl">
          Barcha Kontentlar
        </h1>
      </header>

      {/* Filter Form */}
      <form className="mb-8 flex flex-col gap-4 md:flex-row md:items-center rounded-3xl border border-[rgba(0,255,163,0.12)] bg-[#0B1013] p-2 md:p-3 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-1 min-w-0 flex-col md:flex-row md:items-center gap-3 w-full">
          <input
            name="q"
            defaultValue={query}
            placeholder="Nomi yoki kalit so'z..."
            aria-label="Kontent nomi yoki kalit so'z"
            className="min-h-[56px] flex-1 rounded-2xl border border-transparent bg-[#141F24] px-6 text-base font-medium text-[#F8FAFC] outline-none placeholder:text-[#475569] transition-all hover:bg-[#1A262C] focus:border-[#00FFA3] focus:bg-[#070A0C] focus:shadow-[0_0_20px_rgba(0,255,163,0.1)]"
          />
          <div className="flex gap-3 w-full md:w-auto">
            <select
              name="type"
              defaultValue={type}
              aria-label="Kontent turi"
              className="min-h-[56px] flex-1 md:w-[150px] rounded-2xl border border-transparent bg-[#141F24] px-5 text-base font-semibold text-[#F8FAFC] outline-none transition-all hover:bg-[#1A262C] focus:border-[#00FFA3] focus:bg-[#070A0C] focus:shadow-[0_0_20px_rgba(0,255,163,0.1)] cursor-pointer"
            >
              <option value="movie">Filmlar</option>
              <option value="series">Seriallar</option>
            </select>
            <select
              name="genre"
              defaultValue={genre}
              aria-label="Janr"
              className="min-h-[56px] flex-1 md:w-[180px] rounded-2xl border border-transparent bg-[#141F24] px-5 text-base font-semibold text-[#F8FAFC] outline-none transition-all hover:bg-[#1A262C] focus:border-[#00FFA3] focus:bg-[#070A0C] focus:shadow-[0_0_20px_rgba(0,255,163,0.1)] cursor-pointer"
            >
              <option value="">Barcha janrlar</option>
              {genres.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="flex min-h-[56px] shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-[#00FFA3] px-8 text-base font-bold text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all duration-300 hover:bg-[#1AFFA8] hover:shadow-[0_0_30px_rgba(0,255,163,0.4)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <SlidersHorizontal size={20} aria-hidden="true" />
          Qidirish
        </button>
      </form>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-[#00e599]" size={36} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex w-full min-w-0 flex-col items-center justify-center rounded-[2rem] border border-[rgba(0,255,163,0.1)] bg-gradient-to-b from-[#0F171A] to-[#070A0C] py-24 sm:py-32 text-center shadow-lg">
          <div className="mb-5 flex size-20 items-center justify-center rounded-3xl border border-[rgba(0,255,163,0.2)] bg-[rgba(0,255,163,0.04)] text-[#00FFA3] shadow-[0_0_30px_rgba(0,255,163,0.1)]">
            <SearchX size={32} />
          </div>
          <h2 className="mb-2 font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Hech narsa topilmadi
          </h2>
          <p className="text-[#64748B] text-sm sm:text-base max-w-sm">
            Boshqa kalit so'z yoki janr tanlab ko'ring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {items.map(item => (
            <MediaCard key={item.id} item={item} type={type} />
          ))}
        </div>
      )}
    </div>
  )
}
