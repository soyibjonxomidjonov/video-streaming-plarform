'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Search, X, SlidersHorizontal, Film, RotateCcw } from 'lucide-react'
import { api, unwrapList, type Genre, type MediaItem } from '@/lib/api'
import MediaCard from '@/components/media-card'

type SortOption = { label: string; value: string }
const SORT_OPTIONS: SortOption[] = [
  { label: 'Eng yangi', value: '-created_at' },
  { label: 'Eng eski', value: 'created_at' },
  { label: 'A → Z', value: 'title' },
  { label: 'Z → A', value: '-title' },
  { label: 'Qisqasi', value: 'duration_seconds' },
  { label: 'Uzuni', value: '-duration_seconds' },
]

type Props = { genres: Genre[] }

export default function MoviesClient({ genres }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [ordering, setOrdering] = useState('-created_at')
  const [showFilters, setShowFilters] = useState(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedRef = useRef(false)

  const buildParams = useCallback(
    (pg: number, q?: string, genre?: number | null) => {
      const params = new URLSearchParams()
      params.set('page', String(pg))
      params.set('ordering', ordering)
      if (q ?? search) params.set('search', q ?? search)
      if ((genre ?? selectedGenre) !== null) params.set('genre', String(genre ?? selectedGenre))
      return params.toString()
    },
    [ordering, search, selectedGenre]
  )

  const fetchMovies = useCallback(
    async (pg: number, q?: string, genre?: number | null, reset = false) => {
      if (pg === 1) setLoading(true)
      else setLoadingMore(true)

      try {
        const data = await api.movies(buildParams(pg, q, genre))
        const list = unwrapList(data)
        const count = !Array.isArray(data) ? (data.count ?? 0) : list.length
        const hasNext = !Array.isArray(data) ? Boolean(data.next) : false

        if (reset || pg === 1) setItems(list)
        else setItems((prev) => [...prev, ...list])
        setTotalCount(count)
        setHasMore(hasNext)
        setPage(pg)
      } catch {
        if (pg === 1) setItems([])
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [buildParams]
  )

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      void fetchMovies(1)
    }
  }, [fetchMovies])

  const handleSearch = (q: string) => {
    setSearch(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      void fetchMovies(1, q, selectedGenre, true)
    }, 400)
  }

  const handleGenre = (genreId: number | null) => {
    setSelectedGenre(genreId)
    void fetchMovies(1, search, genreId, true)
  }

  const handleSort = (val: string) => {
    setOrdering(val)
  }

  useEffect(() => {
    if (loadedRef.current) {
      void fetchMovies(1, search, selectedGenre, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordering])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      void fetchMovies(page + 1)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedGenre(null)
    setOrdering('-created_at')
    void fetchMovies(1, '', null, true)
  }

  const hasFilters = search || selectedGenre !== null || ordering !== '-created_at'

  return (
    <div className="w-full min-w-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Filmlar</h1>
        {totalCount > 0 && (
          <p className="mt-1 text-sm text-[#64748B]">{totalCount} ta film topildi</p>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="mb-6 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="group flex flex-1 min-w-0 items-center gap-3 rounded-2xl border border-[rgba(0,255,163,0.12)] bg-[#0B1013] px-6 min-h-[56px] transition-all duration-300 hover:border-[rgba(0,255,163,0.25)] focus-within:border-[#00FFA3] focus-within:bg-[#070A0C] focus-within:shadow-[0_0_20px_rgba(0,255,163,0.1)]">
          <Search size={20} className="shrink-0 text-[#64748B] transition-colors group-focus-within:text-[#00FFA3]" />
          <input
            id="movies-search"
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Filmlarni qidirish..."
            className="min-w-0 w-full bg-transparent text-base font-medium text-[#F8FAFC] outline-none placeholder:text-[#475569] border-none shadow-none ring-0 focus:ring-0 focus:shadow-none"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="shrink-0 text-[#64748B] hover:text-[#EF4444] transition-colors rounded-full p-1 hover:bg-red-500/10">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          id="movies-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex shrink-0 items-center gap-2.5 rounded-2xl px-6 min-h-[56px] text-base font-semibold transition-all duration-300 ${
            showFilters || hasFilters
              ? 'bg-[#00FFA3] text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:bg-[#1AFFA8] hover:shadow-[0_0_30px_rgba(0,255,163,0.4)] hover:-translate-y-0.5'
              : 'border border-[rgba(0,255,163,0.15)] bg-[#0B1013] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[rgba(0,255,163,0.35)] hover:bg-[#141F24]'
          }`}
        >
          <SlidersHorizontal size={20} className={showFilters || hasFilters ? 'text-[#070A0C]' : 'text-[#64748B]'} />
          <span>Filtrlar</span>
          {hasFilters && <span className="rounded-full bg-[#070A0C] px-1.5 py-0.5 text-[10px] font-black text-[#00FFA3]">!</span>}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 w-full min-w-0 rounded-2xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-4 sm:p-5 space-y-4">
          {/* Sort */}
          <div>
            <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-[#00FFA3]">
              Tartiblash
            </p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSort(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition min-h-[36px] ${
                    ordering === opt.value
                      ? 'bg-[#00FFA3] text-[#070A0C]'
                      : 'border border-[rgba(0,255,163,0.12)] bg-[#141F24] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[rgba(0,255,163,0.25)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div>
              <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-[#00FFA3]">
                Janrlar
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleGenre(null)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition min-h-[36px] ${
                    selectedGenre === null
                      ? 'bg-[#00FFA3] text-[#070A0C]'
                      : 'border border-[rgba(0,255,163,0.12)] bg-[#141F24] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[rgba(0,255,163,0.25)]'
                  }`}
                >
                  Barchasi
                </button>
                {genres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGenre(g.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition min-h-[36px] ${
                      selectedGenre === g.id
                        ? 'bg-[#00FFA3] text-[#070A0C]'
                        : 'border border-[rgba(0,255,163,0.12)] bg-[#141F24] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[rgba(0,255,163,0.25)]'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasFilters && (
            <div className="flex justify-end border-t border-[rgba(0,255,163,0.08)] pt-3">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#EF4444] transition hover:text-[#ff6b6b]"
              >
                <RotateCcw size={12} />
                Filtrlarni tozalash
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full min-w-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] w-full min-w-0 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="flex w-full min-w-0 flex-col items-center justify-center rounded-[2rem] border border-[rgba(0,255,163,0.1)] bg-gradient-to-b from-[#0F171A] to-[#070A0C] py-24 sm:py-32 text-center shadow-lg">
          <div className="mb-5 flex size-20 items-center justify-center rounded-3xl border border-[rgba(0,255,163,0.2)] bg-[rgba(0,255,163,0.04)] text-[#00FFA3] shadow-[0_0_30px_rgba(0,255,163,0.1)]">
            <Film size={32} />
          </div>
          <h2 className="mb-2 font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Filmlar topilmadi
          </h2>
          <p className="text-[#64748B] text-sm sm:text-base max-w-sm">
            Qidiruv so'rovini yoki filtrlarni o'zgartirib ko'ring
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-6 flex items-center gap-1.5 rounded-xl border border-[rgba(0,255,163,0.2)] px-5 py-2.5 text-sm font-medium text-[#00FFA3] transition hover:bg-[rgba(0,255,163,0.08)]"
            >
              <RotateCcw size={14} />
              Filtrlarni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 sm:gap-8 w-full min-w-0">
            {items.map((item) => (
              <div key={item.id} className="min-w-0 w-full">
                <MediaCard item={item} type="movie" />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                id="load-more-movies-btn"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] px-7 py-3 text-sm font-semibold text-[#00FFA3] transition hover:bg-[rgba(0,255,163,0.08)] disabled:opacity-50 min-h-[44px]"
              >
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : 'Yana yuklash'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
