'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Filter, Loader2, Search, SortAsc, X } from 'lucide-react'
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

        if (reset || pg === 1) {
          setItems(list)
        } else {
          setItems(prev => [...prev, ...list])
        }
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

  // Initial load
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      void fetchMovies(1)
    }
  }, [fetchMovies])

  // Search debounce
  const handleSearch = (q: string) => {
    setSearch(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      void fetchMovies(1, q, selectedGenre, true)
    }, 400)
  }

  // Genre filter
  const handleGenre = (genreId: number | null) => {
    setSelectedGenre(genreId)
    void fetchMovies(1, search, genreId, true)
  }

  // Ordering
  const handleSort = (val: string) => {
    setOrdering(val)
    // fetchMovies will be triggered by ordering change
  }

  // Re-fetch on ordering change
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
    <div>
      {/* Filter bar */}
      <div className="mb-5 flex flex-col gap-3">
        {/* Search + Filter toggle */}
        <div className="flex min-w-0 gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
            <Search size={15} className="text-muted-foreground" />
            <input
              id="movies-search"
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Film qidirish..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              style={{ border: 'none' }}
            />
            {search && (
              <button onClick={() => handleSearch('')} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            id="movies-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition sm:px-4 ${
              showFilters || hasFilters
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtr</span>
            {hasFilters && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-bold text-primary">!</span>
            )}
          </button>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="animate-slide-up rounded-xl border border-border bg-surface p-3 sm:p-4">
            {/* Sort */}
            <div className="mb-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <SortAsc size={13} /> Tartiblash
              </p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSort(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      ordering === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-2 text-muted-foreground hover:text-foreground'
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Janr</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleGenre(null)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      selectedGenre === null
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Barchasi
                  </button>
                  {genres.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleGenre(g.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        selectedGenre === g.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <X size={12} /> Filtrlarni tozalash
              </button>
            )}
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && totalCount > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          Jami <span className="font-semibold text-foreground">{totalCount}</span> ta film
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton aspect-[2/3] rounded-2xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-display text-lg font-bold">Film topilmadi</p>
          <p className="text-sm text-muted-foreground">Boshqa kalit so&apos;z bilan qidirib ko&apos;ring</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm font-semibold text-primary">
              Filtrlarni tozalash
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map(item => (
              <MediaCard key={item.id} item={item} type="movie" />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                id="movies-load-more"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
              >
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
                {loadingMore ? 'Yuklanmoqda...' : 'Ko\'proq yuklash'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
