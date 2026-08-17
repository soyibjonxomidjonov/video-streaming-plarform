// @ts-nocheck
'use client'

import React, { memo, useEffect, useState } from 'react'
import Link from 'next/link'
// @ts-ignore
import { ChevronRight, Film, Tv, Flame, Layers, TrendingUp, Calendar, Search } from 'lucide-react'
import { api, unwrapList, type MediaItem, type Genre } from '@/lib/api'
import MediaCard from '@/components/media-card'
import { HeroBanner } from '@/components/home/hero-banner'
import PageContainer from '@/components/layout/page-container'

// ──────────────────────────────────────────────────────────────────
// SectionRow — titled grid of MediaCards
// ──────────────────────────────────────────────────────────────────
const SectionRow = memo(function SectionRow({
  title,
  kicker,
  items,
  type = 'movie',
  href,
  icon: Icon,
}: {
  title: string
  kicker?: string
  items: MediaItem[]
  type?: 'movie' | 'series'
  href: string
  icon?: React.ElementType
}) {
  if (items.length === 0) return null

  return (
    <section className="w-full min-w-0" aria-labelledby={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      {/* Section Header */}
      <div className="mb-5 flex min-w-0 items-end justify-between gap-4 px-0.5">
        <div className="min-w-0">
          {kicker && (
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#00FFA3]">
              {Icon && <Icon size={12} aria-hidden="true" />}
              {kicker}
            </p>
          )}
          <h2
            id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
            className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#F8FAFC]"
          >
            {title}
          </h2>
        </div>
        <Link
          href={href}
          prefetch={true}
          aria-label={`${title} — Barchasini ko'rish`}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#6B7280] transition hover:text-[#00FFA3] focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:rounded-md"
        >
          Barchasini
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {/* Responsive premium card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-16 w-full min-w-0 mt-8 sm:mt-12">
        {items.map((item) => (
          <div key={item.id} className="min-w-0 w-full">
            <MediaCard item={item} type={type} />
          </div>
        ))}
      </div>
    </section>
  )
})

// ──────────────────────────────────────────────────────────────────
// HomeSkeleton — matches final layout geometry exactly (zero CLS)
// ──────────────────────────────────────────────────────────────────
function HomeSkeleton() {
  return (
    <PageContainer className="space-y-16 sm:space-y-24 py-8 sm:py-12" aria-busy="true" aria-label="Yuklanmoqda">
      {/* Hero skeleton */}
      <div className="relative min-h-[60vh] lg:min-h-[75vh] rounded-[2rem] sm:rounded-[2.5rem] border border-[rgba(0,255,163,0.08)] bg-[#0F171A] p-6 sm:p-12 lg:p-20 flex flex-col justify-end gap-6">
        <div className="flex gap-3">
          <div className="h-8 w-24 rounded-full bg-[#141F24] skeleton" />
          <div className="h-8 w-20 rounded-full bg-[#141F24] skeleton" />
        </div>
        <div className="h-16 w-3/4 max-w-4xl rounded-2xl bg-[#141F24] skeleton" />
        <div className="h-6 w-1/2 max-w-2xl rounded-xl bg-[#141F24] skeleton opacity-50" />
        <div className="flex gap-4 mt-2">
          <div className="h-14 w-44 rounded-full bg-[#141F24] skeleton" />
          <div className="h-14 w-44 rounded-full bg-[#141F24] skeleton opacity-50" />
        </div>
      </div>

      {/* Genre pills skeleton */}
      <div className="space-y-4">
        <div className="h-3 w-32 rounded-full bg-[#141F24] skeleton" />
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 w-28 rounded-xl bg-[#141F24] skeleton" />
          ))}
        </div>
      </div>

      {/* Card grid skeleton */}
      {[1, 2].map((section) => (
        <div key={section} className="space-y-6 sm:space-y-8">
          <div className="h-10 w-64 rounded-xl bg-[#141F24] skeleton" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-16 w-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[2/3] w-full rounded-2xl bg-[#0F171A] skeleton" />
                <div className="space-y-2 px-1">
                  <div className="h-5 w-3/4 rounded-md bg-[#141F24] skeleton" />
                  <div className="h-3 w-1/2 rounded-md bg-[#141F24] skeleton opacity-60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </PageContainer>
  )
}

// ──────────────────────────────────────────────────────────────────
// HomePage
// ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [series, setSeries] = useState<MediaItem[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        const [mRes, sRes, gRes] = await Promise.allSettled([
          api.movies('ordering=-created_at'),
          api.series('ordering=-created_at'),
          api.genres(),
        ])
        if (!active) return
        if (mRes.status === 'fulfilled') setMovies(unwrapList(mRes.value))
        if (sRes.status === 'fulfilled') setSeries(unwrapList(sRes.value))
        if (gRes.status === 'fulfilled') setGenres(unwrapList(gRes.value))
        if (mRes.status === 'rejected' && sRes.status === 'rejected') setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadData()
    return () => { active = false }
  }, [])

  if (loading && movies.length === 0 && series.length === 0) {
    return <HomeSkeleton />
  }

  // Error state
  if (error && movies.length === 0 && series.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center px-4">
        <div className="flex size-20 items-center justify-center rounded-3xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] text-[#00FFA3]">
          <Film size={36} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-[#F8FAFC] mb-2">Xatolik yuz berdi</h2>
          <p className="text-[#6B7280] text-sm max-w-sm">Ma'lumotlarni yuklashda muammo. Internet aloqangizni tekshirib, sahifani yangilang.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-[#00FFA3] px-6 py-3 text-sm font-bold text-[#070A0C] hover:bg-[#1AFFA8] transition hover:scale-105 active:scale-95"
        >
          Qayta urinish
        </button>
      </div>
    )
  }

  // Empty state
  if (!loading && movies.length === 0 && series.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center px-4">
        <div className="flex size-20 items-center justify-center rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] text-[#00FFA3]">
          <Search size={36} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-[#F8FAFC] mb-2">Hali kontent yo'q</h2>
          <p className="text-[#6B7280] text-sm max-w-sm">Platforma hali to'ldirilmoqda. Tez orada yangi filmlar va seriallar qo'shiladi.</p>
        </div>
      </div>
    )
  }

  const featured = movies[0] ?? series[0]

  return (
    <PageContainer className="space-y-16 sm:space-y-24 py-8 sm:py-12">
      {/* Hero Banner */}
      <HeroBanner movie={featured} />

      {/* Genre Pills */}
      {genres.length > 0 && (
        <section className="w-full min-w-0" aria-labelledby="genres-heading">
          <p
            id="genres-heading"
            className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-[#00FFA3] flex items-center gap-2"
          >
            <Layers size={14} aria-hidden="true" />
            Mashhur Janrlar
          </p>
          <div className="flex flex-wrap gap-3" role="list" aria-label="Janrlar ro'yxati">
            {genres.map((g) => (
              <Link
                key={g.id}
                href={`/genre/${encodeURIComponent(g.name)}`}
                prefetch={true}
                role="listitem"
                className="rounded-xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-300 hover:border-[#00FFA3]/40 hover:bg-[#00FFA3]/10 hover:text-[#00FFA3] hover:-translate-y-1 shadow-sm hover:shadow-[0_4px_20px_rgba(0,255,163,0.1)] outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Movies */}
      <SectionRow
        title="Hozir Trendda"
        kicker="TOP TRENDING"
        items={movies.slice(0, 12)}
        type="movie"
        href="/movies?ordering=-created_at"
        icon={Flame}
      />

      {/* New Movies */}
      {movies.length > 1 && (
        <SectionRow
          title="Yangi Filmlar"
          kicker="PREMYERALAR"
          items={movies.slice(1, 13)}
          type="movie"
          href="/movies"
          icon={Film}
        />
      )}

      {/* Popular Series */}
      <SectionRow
        title="Mashhur Seriallar"
        kicker="SERIAL & EPISODES"
        items={series.slice(0, 12)}
        type="series"
        href="/series"
        icon={Tv}
      />
    </PageContainer>
  )
}
