'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Filter, Loader2, Search, X } from 'lucide-react'
import { api, unwrapList, type Genre, type MediaItem } from '@/lib/api'
import MediaCard from '@/components/media-card'

type Props = { genres: Genre[] }

const SORT_OPTIONS = [
  { label: 'Eng yangi', value: '-created_at' },
  { label: 'Eng eski', value: 'created_at' },
  { label: 'A → Z', value: 'title' },
  { label: 'Z → A', value: '-title' },
]

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

  const buildParams = useCallback((pg: number, q?: string, genre?: number | null) => {
    const p = new URLSearchParams()
    p.set('page', String(pg))
    p.set('ordering', ordering)
    if (q ?? search) p.set('search', q ?? search)
    if ((genre ?? selectedGenre) !== null) p.set('genre', String(genre ?? selectedGenre))
    return p.toString()
  }, [ordering, search, selectedGenre])

  const fetchSeries = useCallback(async (pg: number, q?: string, genre?: number | null, reset = false) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const data = await api.series(buildParams(pg, q, genre))
      const list = unwrapList(data)
      const count = !Array.isArray(data) ? (data.count ?? 0) : list.length
      const hasNext = !Array.isArray(data) ? Boolean(data.next) : false
      if (reset || pg === 1) setItems(list)
      else setItems(prev => [...prev, ...list])
      setTotalCount(count)
      setHasMore(hasNext)
      setPage(pg)
    } catch {
      if (pg === 1) setItems([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildParams])

  useEffect(() => {
    if (!loadedRef.current) { loadedRef.current = true; void fetchSeries(1) }
  }, [fetchSeries])

  useEffect(() => {
    if (loadedRef.current) void fetchSeries(1, search, selectedGenre, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordering])

  const handleSearch = (q: string) => {
    setSearch(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => void fetchSeries(1, q, selectedGenre, true), 400)
  }

  const handleGenre = (id: number | null) => {
    setSelectedGenre(id)
    void fetchSeries(1, search, id, true)
  }

  const clearFilters = () => {
    setSearch(''); setSelectedGenre(null); setOrdering('-created_at')
    void fetchSeries(1, '', null, true)
  }

  const hasFilters = search || selectedGenre !== null || ordering !== '-created_at'

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl px-4 py-3" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
            <Search size={15} className="text-muted-foreground" />
            <input
              id="series-search"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Serial qidirish..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              style={{ border: 'none' }}
            />
            {search && <button onClick={() => handleSearch('')}><X size={14} className="text-muted-foreground" /></button>}
          </div>
          <button
            id="series-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition"
            style={showFilters || hasFilters ? { background: '#f5a623', color: '#0a0a0c' } : { border: '1px solid #2a2a30', color: '#9a9aa2' }}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtr</span>
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl p-4 animate-slide-up" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tartiblash</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setOrdering(opt.value)} className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                    style={ordering === opt.value ? { background: '#f5a623', color: '#0a0a0c' } : { background: '#202024', color: '#9a9aa2' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {genres.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Janr</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleGenre(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                    style={selectedGenre === null ? { background: '#f5a623', color: '#0a0a0c' } : { background: '#202024', color: '#9a9aa2' }}>
                    Barchasi
                  </button>
                  {genres.map(g => (
                    <button key={g.id} onClick={() => handleGenre(g.id)} className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                      style={selectedGenre === g.id ? { background: '#f5a623', color: '#0a0a0c' } : { background: '#202024', color: '#9a9aa2' }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <X size={12} /> Tozalash
              </button>
            )}
          </div>
        )}
      </div>

      {!loading && totalCount > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          Jami <span className="font-semibold text-foreground">{totalCount}</span> ta serial
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton aspect-[2/3] rounded-2xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-display text-lg font-bold">Serial topilmadi</p>
          {hasFilters && <button onClick={clearFilters} style={{ color: '#f5a623' }} className="text-sm font-semibold">Filtrlarni tozalash</button>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map(item => <MediaCard key={item.id} item={item} type="series" />)}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button id="series-load-more" onClick={() => void fetchSeries(page + 1)} disabled={loadingMore}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
                style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }}>
                {loadingMore && <Loader2 size={16} className="animate-spin" />}
                {loadingMore ? 'Yuklanmoqda...' : 'Ko\'proq yuklash'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
