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
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#00e599]">
          KASHF ETISH VA FILTRLAR
        </p>
        <h1 className="font-display text-2xl font-black text-[#f5f7f6] sm:text-3xl">
          Barcha Kontentlar
        </h1>
      </header>

      {/* Filter Form */}
      <form className="mb-8 flex flex-col gap-3 rounded-3xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-4 md:flex-row shadow-xl">
        <input
          name="q"
          defaultValue={query}
          placeholder="Nomi yoki kalit so'z..."
          className="min-h-11 flex-1 rounded-2xl border border-[rgba(0,229,153,0.15)] bg-[#161f1c] px-4 text-xs text-[#f5f7f6] outline-none focus:border-[#00e599]"
        />
        <select
          name="type"
          defaultValue={type}
          className="min-h-11 rounded-2xl border border-[rgba(0,229,153,0.15)] bg-[#161f1c] px-4 text-xs font-bold text-[#f5f7f6] outline-none focus:border-[#00e599]"
        >
          <option value="movie">Filmlar</option>
          <option value="series">Seriallar</option>
        </select>
        <select
          name="genre"
          defaultValue={genre}
          className="min-h-11 rounded-2xl border border-[rgba(0,229,153,0.15)] bg-[#161f1c] px-4 text-xs font-bold text-[#f5f7f6] outline-none focus:border-[#00e599]"
        >
          <option value="">Barcha janrlar</option>
          {genres.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button
          className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#00e599] px-6 text-xs font-bold text-[#080a0a] shadow-[0_0_15px_rgba(0,229,153,0.3)] transition hover:bg-[#1df2ad]"
        >
          <SlidersHorizontal size={15} /> Qidirish
        </button>
      </form>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-[#00e599]" size={36} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[rgba(0,229,153,0.2)] bg-[#101514] p-12 text-center">
          <SearchX className="text-[#8c9994]" size={32} />
          <p className="font-display text-base font-bold text-[#f5f7f6]">Hech narsa topilmadi</p>
          <p className="max-w-sm text-xs text-[#8c9994]">
            Boshqa kalit so&apos;z yoki janr tanlab ko&apos;ring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map(item => (
            <MediaCard key={item.id} item={item} type={type} />
          ))}
        </div>
      )}
    </div>
  )
}
