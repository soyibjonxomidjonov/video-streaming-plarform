'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Film, Loader2, Mic, Search as SearchIcon, Sparkles, TvMinimal, X } from 'lucide-react'
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
      // Parallel: 1) Semantic Search (pgvector), 2) DRF Movies search, 3) DRF Series search
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
      void performSearch(initialQuery)
    }
  }, [initialQuery, performSearch])

  const handleInputChange = (val: string) => {
    setQuery(val)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      void performSearch(val)
    }, 450)
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
      <div className="relative">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-xl transition-all"
          style={{ background: '#16161a', border: '1px solid #2a2a30' }}
        >
          <SearchIcon size={20} className="text-muted-foreground shrink-0" />
          <input
            id="main-search-input"
            type="text"
            value={query}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Filmlar, seriallar, aktyorlar yoki ma'nosi bo'yicha qidiring..."
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            style={{ border: 'none' }}
            autoFocus
          />
          {query && (
            <button onClick={handleClear} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          )}
          <button
            onClick={toggleVoice}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              voiceEnabled
                ? 'text-black'
                : 'text-muted-foreground hover:text-primary'
            }`}
            style={voiceEnabled ? { background: '#f5a623' } : { background: '#202024' }}
            aria-label="Ovozli qidiruv"
          >
            <Mic size={15} />
            <span className="hidden sm:inline">{voiceEnabled ? 'Tinglamoqda' : 'Ovozli'}</span>
          </button>
        </div>
      </div>

      {/* Recommended sample queries if empty */}
      {!searched && !loading && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles size={14} style={{ color: '#f5a623' }} /> Mashhur izlanishlar
          </p>
          <div className="flex flex-wrap gap-2">
            {['Dune', 'Oppenheimer', 'The Last of Us', 'Spider-Man', 'Witcher', 'Batman', 'Fantastika', 'Jangari'].map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag)
                  void performSearch(tag)
                }}
                className="rounded-xl px-4 py-2 text-sm font-medium transition hover:text-foreground"
                style={{ background: '#16161a', border: '1px solid #2a2a30', color: '#9a9aa2' }}
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
          <Loader2 size={32} className="animate-spin" style={{ color: '#f5a623' }} />
          <p className="mt-3 text-sm text-muted-foreground">Sun&apos;iy intellekt qidirmoqda...</p>
        </div>
      )}

      {/* Empty result */}
      {!loading && searched && totalResults === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Film size={36} className="text-muted-foreground/50 mb-2" />
          <p className="font-display text-lg font-bold">&quot;{query}&quot; bo&apos;yicha hech narsa topilmadi</p>
          <p className="mt-1 text-sm text-muted-foreground">So&apos;rovni boshqacha yozib yoki ovozli qidiruvdan foydalanib ko&apos;ring</p>
        </div>
      )}

      {/* Results */}
      {!loading && searched && totalResults > 0 && (
        <div className="flex flex-col gap-8">
          {/* SEMANTIC RESULTS (Embedding Search) */}
          {semanticResults.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <Sparkles size={18} style={{ color: '#f5a623' }} />
                Semantik natijalar ({semanticResults.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {semanticResults.map(res => (
                  <a
                    key={`${res.content_type}-${res.object_id}`}
                    href={`/${res.content_type}/${res.object_id}`}
                    className="flex flex-col gap-1 rounded-2xl p-4 transition hover:border-amber-400/50"
                    style={{ background: '#16161a', border: '1px solid #2a2a30' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5" style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>
                        {res.content_type === 'series' ? 'Serial' : 'Film'}
                      </span>
                      {res.distance !== undefined && (
                        <span className="text-[11px] text-muted-foreground">
                          Moslik: {Math.max(0, Math.round((1 - res.distance) * 100))}%
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mt-1">{res.title}</h3>
                    {res.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{res.description}</p>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* MOVIES RESULTS */}
          {movies.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <Film size={18} style={{ color: '#f5a623' }} />
                Filmlar ({movies.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {movies.map(movie => (
                  <MediaCard key={movie.id} item={movie} type="movie" />
                ))}
              </div>
            </section>
          )}

          {/* SERIES RESULTS */}
          {series.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <TvMinimal size={18} style={{ color: '#38bdf8' }} />
                Seriallar ({series.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {series.map(item => (
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
