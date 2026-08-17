'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clapperboard, Loader2 } from 'lucide-react'
import { api, unwrapList, type Genre } from '@/lib/api'

// Genre card colors — cycling palette for visual variety
const GENRE_ACCENTS = [
  'from-[#00FFA3]/20 to-[#0D4D38]/30 border-[#00FFA3]/20 hover:border-[#00FFA3]/50',
  'from-[#3B82F6]/20 to-[#1E3A5F]/30 border-[#3B82F6]/20 hover:border-[#3B82F6]/50',
  'from-[#F59E0B]/20 to-[#78350F]/30 border-[#F59E0B]/20 hover:border-[#F59E0B]/50',
  'from-[#EF4444]/20 to-[#7F1D1D]/30 border-[#EF4444]/20 hover:border-[#EF4444]/50',
  'from-[#8B5CF6]/20 to-[#3B1A6B]/30 border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50',
  'from-[#EC4899]/20 to-[#831843]/30 border-[#EC4899]/20 hover:border-[#EC4899]/50',
]
const GENRE_ICON_COLORS = [
  'text-[#00FFA3] bg-[rgba(0,255,163,0.12)]',
  'text-[#3B82F6] bg-[rgba(59,130,246,0.12)]',
  'text-[#F59E0B] bg-[rgba(245,158,11,0.12)]',
  'text-[#EF4444] bg-[rgba(239,68,68,0.12)]',
  'text-[#8B5CF6] bg-[rgba(139,92,246,0.12)]',
  'text-[#EC4899] bg-[rgba(236,72,153,0.12)]',
]

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
      <div className="w-full min-w-0">
        <div className="mb-6">
          <div className="h-3 w-44 rounded-full skeleton opacity-60 mb-2" />
          <div className="h-8 w-56 rounded-xl skeleton" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0">
      {/* Page header */}
      <div className="mb-8">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00FFA3]">
          KATALOG &amp; KATEGORIYALAR
        </p>
        <h1 className="font-display text-2xl font-black text-[#F8FAFC] sm:text-3xl">
          Barcha Janrlar
          {genres.length > 0 && (
            <span className="ml-3 text-base font-semibold text-[#64748B]">({genres.length})</span>
          )}
        </h1>
      </div>

      {genres.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,255,163,0.2)] bg-[#0F171A] py-16 text-center">
          <Clapperboard size={36} className="mb-3 text-[#64748B]" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-[#F8FAFC]">Janrlar topilmadi</p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-5"
          role="list"
          aria-label="Janrlar ro'yxati"
        >
          {genres.map((genre, i) => {
            const accent = GENRE_ACCENTS[i % GENRE_ACCENTS.length]
            const iconColor = GENRE_ICON_COLORS[i % GENRE_ICON_COLORS.length]
            return (
              <Link
                key={genre.id}
                href={`/genre/${encodeURIComponent(genre.name)}`}
                role="listitem"
                aria-label={`${genre.name} janridagi kontentlarni ko'rish`}
                className={`group flex flex-col items-center justify-center gap-3 rounded-2xl border bg-gradient-to-br p-5 sm:p-6 text-center transition-all duration-200 hover:scale-105 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2 min-h-[120px] ${accent}`}
              >
                <div className={`flex size-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 ${iconColor}`}>
                  <Clapperboard size={22} aria-hidden="true" />
                </div>
                <span className="font-display text-sm font-bold text-[#F8FAFC] leading-tight group-hover:text-[#00FFA3] transition-colors duration-200">
                  {genre.name}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
