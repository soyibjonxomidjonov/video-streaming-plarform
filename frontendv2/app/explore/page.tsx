import { api, unwrapList, type Genre, type MediaItem } from '@/lib/api'
import MediaCard from '@/components/media-card'
import Link from 'next/link'
import { SearchX } from 'lucide-react'

export const metadata = { title: 'Explore' }

type SearchParams = { q?: string; genre?: string; type?: string; page?: string; sort?: string }

function buildQuery(base: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...base, ...overrides }
  const params = new URLSearchParams()
  if (merged.q) params.set('q', merged.q)
  if (merged.genre) params.set('genre', merged.genre)
  if (merged.type) params.set('type', merged.type)
  if (merged.sort) params.set('sort', merged.sort)
  if (merged.page) params.set('page', merged.page)
  return params.toString()
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const query = params.q ?? ''
  const genre = params.genre ?? ''
  const type = (params.type === 'series' ? 'series' : 'movie') as 'movie' | 'series'
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const sort = params.sort ?? '-rating'

  let items: MediaItem[] = []
  let genres: Genre[] = []
  let failed = false

  try {
    const filterParams = new URLSearchParams({ ordering: sort, page: String(page) })
    if (genre) filterParams.set('genre', genre)
    const [data, genreData] = await Promise.all([
      query ? api.search(query) : type === 'series' ? api.series(filterParams.toString()) : api.movies(filterParams.toString()),
      api.genres().catch(() => []),
    ])
    items = unwrapList(data)
    genres = unwrapList(genreData)
  } catch {
    failed = true
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Discover</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-balance">Explore everything</h1>
            <p className="mt-2 text-sm text-muted-foreground">Search, filter and find your next watch.</p>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            Back home
          </Link>
        </header>

        <form className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search titles, actors, genres..."
            className="min-h-12 flex-1 rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <select name="type" defaultValue={type} className="min-h-12 rounded-xl bg-secondary px-4 text-sm outline-none">
            <option value="movie">Movies</option>
            <option value="series">Series</option>
          </select>
          <select name="genre" defaultValue={genre} className="min-h-12 rounded-xl bg-secondary px-4 text-sm outline-none">
            <option value="">All genres</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className="min-h-12 rounded-xl bg-secondary px-4 text-sm outline-none">
            <option value="-rating">Top rated</option>
            <option value="-created_at">Newest</option>
            <option value="title">A–Z</option>
          </select>
          <button className="min-h-12 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:brightness-110">
            Search
          </button>
        </form>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center">
            <SearchX className="text-muted-foreground" size={28} />
            <p className="font-semibold">{failed ? 'Could not reach the catalog' : 'No titles found'}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {failed
                ? 'The streaming API is unreachable right now. Please check your connection and try again.'
                : 'Try a different search term, genre or content type.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map(item => (
              <MediaCard key={item.id} item={item} type={type} />
            ))}
          </div>
        )}

        {!query && items.length > 0 && (
          <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
            <Link
              href={`/explore?${buildQuery(params, { page: String(page - 1) })}`}
              aria-disabled={page <= 1}
              className={`rounded-xl border border-border px-4 py-3 text-sm transition hover:border-primary/50 ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
            >
              Previous
            </Link>
            <span className="rounded-xl bg-secondary px-4 py-3 text-sm">Page {page}</span>
            <Link
              href={`/explore?${buildQuery(params, { page: String(page + 1) })}`}
              className="rounded-xl border border-border px-4 py-3 text-sm transition hover:border-primary/50"
            >
              Next
            </Link>
          </nav>
        )}
      </div>
    </main>
  )
}
