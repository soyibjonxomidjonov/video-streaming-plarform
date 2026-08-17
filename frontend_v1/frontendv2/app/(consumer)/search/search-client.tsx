'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Film, Loader2, Mic, Search as SearchIcon, Sparkles, Tv, X, ArrowRight } from 'lucide-react'
import { api, unwrapList, type MediaItem, type SearchResult } from '@/lib/api'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'
import MediaCard from '@/components/media-card'

export default function SearchClient() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [semanticResults, setSemanticResults] = useState<SearchResult[]>([])
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [series, setSeries] = useState<MediaItem[]>([])
  const [searched, setSearched] = useState(false)

  const { toggle: toggleVoice, enabled: voiceEnabled } = useVoiceAssistant()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setSemanticResults([])
      setMovies([])
      setSeries([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)

    try {
      // Parallel: 1) Semantic Search (?q=), 2) Movies search, 3) Series search
      const [semRes, movRes, serRes] = await Promise.allSettled([
        api.search(trimmed, 20),
        api.searchMovies(trimmed),
        api.searchSeries(trimmed),
      ])

      if (semRes.status === 'fulfilled') {
        setSemanticResults(unwrapList(semRes.value))
      } else {
        setSemanticResults([])
      }

      if (movRes.status === 'fulfilled') {
        setMovies(unwrapList(movRes.value))
      } else {
        setMovies([])
      }

      if (serRes.status === 'fulfilled') {
        setSeries(unwrapList(serRes.value))
      } else {
        setSeries([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      void performSearch(initialQuery)
    }
  }, [initialQuery, performSearch])

  const handleInputChange = (val: string) => {
    setQuery(val)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      void performSearch(val)
    }, 400)
  }

  const handleClear = () => {
    setQuery('')
    setSemanticResults([])
    setMovies([])
    setSeries([])
    setSearched(false)
  }

  const totalResults = movies.length + series.length + semanticResults.length

  return (
    <div className="flex flex-col gap-6">
      {/* Search Input Bar */}
      <div className="relative w-full max-w-4xl mx-auto mb-8">
        <div className="flex items-center h-16 sm:h-18 gap-3 rounded-2xl border-2 border-[#00FFA3]/30 bg-[#0F171A] px-6 shadow-2xl transition-all focus-within:border-[#00FFA3] focus-within:ring-4 focus-within:ring-[#00FFA3]/20">
          <SearchIcon size={28} className="text-[#00FFA3] shrink-0" />
          <input
            id="main-search-input"
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Filmlar, seriallar, aktyorlar yoki syujet ma'nosi bo'yicha qidiring..."
            className="w-full h-full bg-transparent text-lg sm:text-xl text-white outline-none placeholder:text-slate-500 border-none shadow-none focus:ring-0"
            autoFocus
          />
          {query && (
            <button onClick={handleClear} className="text-slate-500 hover:text-white transition">
              <X size={24} />
            </button>
          )}
          <button
            onClick={toggleVoice}
            className={`flex items-center justify-center size-12 rounded-xl transition ${
              voiceEnabled
                ? 'bg-[#00FFA3] text-black shadow-[0_0_15px_rgba(0,255,163,0.5)]'
                : 'text-[#00FFA3] hover:bg-[#00FFA3]/20'
            }`}
            aria-label="Ovozli qidiruv"
          >
            <Mic size={24} className={voiceEnabled ? 'animate-pulse' : ''} />
          </button>
        </div>
      </div>

      {/* Suggested Quick Tags */}
      {!searched && !loading && (
        <div className="mt-2 flex flex-col gap-4">
          <p className="text-sm font-bold uppercase tracking-wider text-[#00FFA3] flex items-center justify-center gap-2">
            <Sparkles size={18} /> Mashhur izlanishlar
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {['Cyberpunk', 'Dune', 'Oppenheimer', 'The Last of Us', 'Spider-Man', 'Witcher', 'Batman', 'Fantastika', 'Jangari'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag)
                  void performSearch(tag)
                }}
                className="px-5 py-2.5 text-base font-semibold rounded-xl bg-[#0F171A] border border-[#00FFA3]/20 text-slate-300 hover:text-white hover:border-[#00FFA3] hover:bg-[#00FFA3]/10 transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 size={40} className="animate-spin text-[#00FFA3]" aria-hidden="true" />
          <p className="mt-4 text-sm font-bold text-[#00FFA3]">AI Semantik qidiruv ishlamoqda...</p>
        </div>
      )}

      {/* No results */}
      {searched && !loading && totalResults === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(0,255,163,0.2)] bg-[#0F171A] py-16 text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[rgba(0,255,163,0.1)] text-[#00FFA3]">
            <SearchIcon size={28} aria-hidden="true" />
          </div>
          <p className="mt-4 font-display text-xl font-bold text-[#F8FAFC]">
            &quot;{query}&quot; so&apos;rovi bo&apos;yicha hech narsa topilmadi
          </p>
          <p className="mt-2 text-sm text-[#64748B]">Boshqa kalit so'z yoki janr bilan qidirib ko'ring.</p>
        </div>
      )}

      {/* Search Results Display */}
      {!loading && totalResults > 0 && (
        <div className="flex flex-col gap-10">
          {/* 1. Semantic pgvector matches */}
          {semanticResults.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-[#00FFA3]" aria-hidden="true" />
                <h2 className="font-display text-xl font-bold text-[#F8FAFC]">
                  Semantik natijalar ({semanticResults.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {semanticResults.map((item) => (
                  <Link
                    key={`${item.content_type}-${item.object_id}`}
                    href={item.content_type === 'series' ? `/series/${item.object_id}` : `/movie/${item.object_id}`}
                    className="group flex flex-col justify-between rounded-2xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-5 transition-all hover:border-[#00FFA3] hover:bg-[#0B1013] hover:shadow-[0_4px_15px_rgba(0,255,163,0.1)] focus-visible:outline-2 focus-visible:outline-[#00FFA3]"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2.5">
                        <span className="font-bold text-[#00FFA3] uppercase tracking-wider text-[11px] bg-[rgba(0,255,163,0.1)] px-2 py-1 rounded-md">
                          {item.content_type === 'series' ? 'Serial' : 'Film'}
                        </span>
                        <span className="text-[11px] font-medium text-[#64748B]">Moslik: {(100 - (item.distance * 100 || 0)).toFixed(0)}%</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-[#F8FAFC] group-hover:text-[#00FFA3] transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-2 text-sm text-[#94A3B8] line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#00FFA3]">
                      <span>Ko'rish</span> <ArrowRight size={14} aria-hidden="true" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 2. Movies results */}
          {movies.length > 0 && (
            <section>
              <h2 className="mb-5 font-display text-xl font-bold text-[#F8FAFC]">
                Filmlar ({movies.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {movies.map((m) => (
                  <MediaCard key={m.id} item={m} type="movie" />
                ))}
              </div>
            </section>
          )}

          {/* 3. Series results */}
          {series.length > 0 && (
            <section>
              <h2 className="mb-5 font-display text-xl font-bold text-[#F8FAFC]">
                Seriallar ({series.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {series.map((s) => (
                  <MediaCard key={s.id} item={s} type="series" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
