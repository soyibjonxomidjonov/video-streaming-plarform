'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clapperboard, Loader2 } from 'lucide-react'
import { api, unwrapList, type Genre } from '@/lib/api'

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.genres()
        setGenres(unwrapList(data))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#00e599]" size={36} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00e599]">
          KATALOG & KATEGORIYALAR
        </p>
        <h1 className="font-display text-2xl font-black text-[#f5f7f6] sm:text-3xl">
          Barcha Janrlar
        </h1>
      </div>

      {genres.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,229,153,0.2)] bg-[#101514] py-16 text-center">
          <Clapperboard size={36} className="mb-2 text-[#8c9994]" />
          <p className="font-display text-lg font-bold text-[#f5f7f6]">Janrlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/genre/${encodeURIComponent(genre.name)}`}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-6 text-center transition hover:border-[#00e599] hover:shadow-[0_0_20px_rgba(0,229,153,0.2)] hover:scale-105"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[rgba(0,229,153,0.12)] text-[#00e599] transition group-hover:scale-110 group-hover:bg-[#00e599] group-hover:text-[#080a0a]">
                <Clapperboard size={22} />
              </div>
              <span className="font-display text-sm font-bold text-[#f5f7f6] group-hover:text-[#00e599] transition">
                {genre.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
