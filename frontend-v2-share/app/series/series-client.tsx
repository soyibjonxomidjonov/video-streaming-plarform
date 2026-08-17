'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Search, X, SlidersHorizontal, Tv, RotateCcw } from 'lucide-react'
import { api, unwrapList, type Genre, type MediaItem } from '@/lib/api'
import MediaCard from '@/components/media-card'

const SORT_OPTIONS = [
  { label: 'Eng yangi', value: '-created_at' },
  { label: 'Eng eski', value: 'created_at' },
  { label: 'A → Z', value: 'title' },
  { label: 'Z → A', value: '-title' },
]

type Props = { genres: Genre[] }

export default function SeriesClient({ genres }: Props) {
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
      const p = new URLSearchParams()
      p.set('page', String(pg))
      p.set('ordering', ordering)
      if (q ?? search) p.set('search', q ?? search)
      if ((genre ?? selectedGenre) !== null) p.set('genre', String(genre ?? selectedGenre))
      return p.toString()
    },
    [ordering, search, selectedGenre]
  )

  const fetchSeries = useCallback(
    async (pg: number, q?: string, genre?: number | null, reset = false) => {
      if (pg === 1) setLoading(true)
      else setLoadingMore(true)
      try {
        const data = await api.series(buildParams(pg, q, genre))
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
      void fetchSeries(1)
    }
  }, [fetchSeries])

  const handleSearch = (q: string) => {
    setSearch(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      void fetchSeries(1, q, selectedGenre, true)
    }, 400)
  }

  const handleGenre = (genreId: number | null) => {
    setSelectedGenre(genreId)
    void fetchSeries(1, search, genreId, true)
  }

  const handleSort = (val: string) => setOrdering(val)

  useEffect(() => {
    if (loadedRef.current) {
      void fetchSeries(1, search, selectedGenre, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordering])

  const loadMore = () => {
    if (!loadingMore && hasMore) void fetchSeries(page + 1)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedGenre(null)
    setOrdering('-created_at')
    void fetchSeries(1, '', null, true)
  }

  const hasFilters = search || selectedGenre !== null || ordering !== '-created_at'

  return (
    <div className="w-full min-w-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Seriallar</h1>
        {totalCount > 0 && (
          <p className="mt-1 text-sm text-[#64748B]">{totalCount} ta serial topildi</p>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="mb-6 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 min-w-0 items-center gap-2.5 rounded-xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] px-3.5 py-2.5 transition focus-within:border-[#00FFA3] focus-within:shadow-[0_0_12px_rgba(0,255,163,0.15)]">
          <Search size={16} className="shrink-0 text-[#64748B]" />
          <input
            id="series-search"
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Seriallarni qidirish..."
            className="min-w-0 w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#64748B] border-none shadow-none ring-0 focus:ring-0 focus:shadow-none"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="shrink-0 text-[#64748B] hover:text-[#F8FAFC] transition">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          id="series-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition min-h-[44px] ${
            showFilters || hasFilters
              ? 'bg-[#00FFA3] text-[#070A0C] shadow-[0_0_12px_rgba(0,255,163,0.3)]'
              : 'border border-[rgba(0,255,163,0.15)] bg-[#0F171A] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[rgba(0,255,163,0.3)]'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>Filtrlar</span>
          {hasFilters && (
            <span className="rounded-full bg-[#070A0C]/30 px-1.5 py-0.5 text-[10px] font-bold">!</span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 w-full min-w-0 rounded-2xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-4 sm:p-5 space-y-4">
          <div>
            <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-[#00FFA3]">Tartiblash</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSort(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition min-h-[36px] ${
                    ordering === opt.value
                      ? 'bg-[#00FFA3] text-[#070A0C]'
                      : 'border border-[rgba(0,255,163,0.12)] bg-[#141F24] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {genres.length > 0 && (
            <div>
              <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-[#00FFA3]">Janrlar</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleGenre(null)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition min-h-[36px] ${
                    selectedGenre === null
                      ? 'bg-[#00FFA3] text-[#070A0C]'
                      : 'border border-[rgba(0,255,163,0.12)] bg-[#141F24] text-[#94A3B8] hover:text-[#F8FAFC]'
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
                        : 'border border-[rgba(0,255,163,0.12)] bg-[#141F24] text-[#94A3B8] hover:text-[#F8FAFC]'
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
        <div className="flex w-full min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,255,163,0.15)] bg-[#0F171A] py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-[rgba(0,255,163,0.2)] bg-[rgba(0,255,163,0.06)] text-[#00FFA3]">
            <Tv size={28} />
          </div>
          <p className="font-display text-lg font-bold text-[#F8FAFC]">Seriallar topilmadi</p>
          <p className="mt-1.5 text-sm text-[#64748B] max-w-xs">
            Qidiruv so&apos;rovini yoki filtrlarni o&apos;zgartirib ko&apos;ring
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 flex items-center gap-1.5 rounded-xl border border-[rgba(0,255,163,0.2)] px-4 py-2 text-sm font-medium text-[#00FFA3] transition hover:bg-[rgba(0,255,163,0.08)]"
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
                <MediaCard item={item} type="series" />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                id="load-more-series-btn"
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
