import Link from 'next/link'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { api, unwrapList, type Genre, type MediaItem } from '@/lib/api'
import AppChrome from '@/components/app-chrome'
import MediaCard from '@/components/media-card'

export const metadata = { title: 'Kashf Etish — S-M' }

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
  const sort = params.sort ?? '-created_at'

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
    <AppChrome>
      <header className="mb-6 flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
          Kashf Etish
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Barcha Kontentlar</h1>
      </header>

      {/* Filter Form */}
      <form className="mb-8 flex flex-col gap-3 rounded-2xl p-4 md:flex-row" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
        <input
          name="q"
          defaultValue={query}
          placeholder="Nomi, janri yoki aktyorlar..."
          className="min-h-11 flex-1 rounded-xl px-4 text-sm outline-none"
          style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
        />
        <select
          name="type"
          defaultValue={type}
          className="min-h-11 rounded-xl px-4 text-sm outline-none"
          style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
        >
          <option value="movie">Filmlar</option>
          <option value="series">Seriallar</option>
        </select>
        <select
          name="genre"
          defaultValue={genre}
          className="min-h-11 rounded-xl px-4 text-sm outline-none"
          style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
        >
          <option value="">Barcha janrlar</option>
          {genres.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="min-h-11 rounded-xl px-4 text-sm outline-none"
          style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
        >
          <option value="-created_at">Eng yangi</option>
          <option value="title">A–Z</option>
        </select>
        <button
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-black transition hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
        >
          <SlidersHorizontal size={16} /> Qidirish
        </button>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center">
          <SearchX className="text-muted-foreground" size={32} />
          <p className="font-semibold">{failed ? 'Katalogga ulanib bo\'lmadi' : 'Hech narsa topilmadi'}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {failed
              ? 'API bilan ulanishda muammo yuz berdi. Internetni tekshirib qayta urining.'
              : 'Boshqa kalit so\'z yoki janr tanlab ko\'ring.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
            className={`rounded-xl border border-border px-4 py-2.5 text-sm transition hover:border-amber-400 ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
          >
            Oldingi
          </Link>
          <span className="rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
            Sahifa {page}
          </span>
          <Link
            href={`/explore?${buildQuery(params, { page: String(page + 1) })}`}
            className="rounded-xl border border-border px-4 py-2.5 text-sm transition hover:border-amber-400"
          >
            Keyingi
          </Link>
        </nav>
      )}
    </AppChrome>
  )
}
