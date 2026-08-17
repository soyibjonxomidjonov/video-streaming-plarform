'use client'

import React, { memo, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Film, Tv, Flame, Layers } from 'lucide-react'
import { api, unwrapList, type MediaItem, type Genre } from '@/lib/api'
import MediaCard from '@/components/media-card'
import HeroBanner from '@/components/home/hero-banner'

// Section row component
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
    <section className="w-full min-w-0">
      {/* Section Header */}
      <div className="mb-6 flex min-w-0 items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          {kicker && (
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00FFA3]">
              {Icon && <Icon size={14} />}
              {kicker}
            </p>
          )}
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            {title}
          </h2>
        </div>
        <Link
          href={href}
          prefetch={true}
          className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#64748B] transition hover:text-[#00FFA3]"
        >
          Barchasini ko&apos;rish
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full min-w-0">
        {items.map((item) => (
          <div key={item.id} className="min-w-0 w-full">
            <MediaCard item={item} type={type} />
          </div>
        ))}
      </div>
    </section>
  )
})

// Skeleton loader
function HomeSkeleton() {
  return (
    <div className="w-full min-w-0 animate-pulse space-y-12">
      {/* Hero skeleton */}
      <div className="relative min-h-[480px] lg:min-h-[560px] rounded-3xl border border-[rgba(0,255,163,0.1)] bg-[#0F171A] p-12 flex flex-col justify-end gap-5">
        <div className="h-6 w-40 rounded-full bg-[rgba(0,255,163,0.12)]" />
        <div className="h-14 w-2/3 rounded-2xl bg-[rgba(255,255,255,0.06)]" />
        <div className="h-5 w-1/2 rounded-xl bg-[rgba(255,255,255,0.04)]" />
        <div className="flex gap-4 mt-3">
          <div className="h-14 w-40 rounded-2xl bg-[rgba(0,255,163,0.2)]" />
          <div className="h-14 w-36 rounded-2xl bg-[#141F24]" />
        </div>
      </div>

      {/* Genre pills skeleton */}
      <div className="flex gap-3 flex-wrap">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 w-24 rounded-xl bg-[#141F24]" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full min-w-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-2xl bg-[#0F171A] border border-[rgba(0,255,163,0.06)]" />
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [series, setSeries] = useState<MediaItem[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)

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

  const featured = movies[0] ?? series[0]

  return (
    <div className="w-full min-w-0 space-y-12 sm:space-y-16">
      {/* Hero Banner */}
      <HeroBanner movie={featured} />

      {/* Genre Pills */}
      {genres.length > 0 && (
        <section className="w-full min-w-0">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-[#00FFA3] flex items-center gap-2">
            <Layers size={14} />
            Mashhur Janrlar
          </p>
          <div className="flex flex-wrap gap-3">
            {genres.map((g) => (
              <Link
                key={g.id}
                href={`/genre/${encodeURIComponent(g.name)}`}
                prefetch={true}
                className="rounded-xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] px-5 py-2.5 text-base font-medium text-[#94A3B8] transition hover:border-[rgba(0,255,163,0.4)] hover:bg-[rgba(0,255,163,0.08)] hover:text-[#00FFA3] hover:scale-105 active:scale-95"
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
        items={movies.slice(0, 10)}
        type="movie"
        href="/movies?ordering=-created_at"
        icon={Flame}
      />

      {/* New Movies */}
      <SectionRow
        title="Yangi Filmlar"
        kicker="PREMYERALAR"
        items={movies.slice(1, 11)}
        type="movie"
        href="/movies"
        icon={Film}
      />

      {/* Popular Series */}
      <SectionRow
        title="Mashhur Seriallar"
        kicker="SERIAL & EPISODES"
        items={series.slice(0, 10)}
        type="series"
        href="/series"
        icon={Tv}
      />
    </div>
  )
}
