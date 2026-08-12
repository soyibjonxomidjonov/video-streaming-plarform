import Link from 'next/link'
import { ChevronRight, Play, Plus } from 'lucide-react'
import { api, mediaDescription, mediaImage, mediaTitle, mediaYear, unwrapList, type MediaItem } from '@/lib/api'
import AppChrome from '@/components/app-chrome'
import MediaCard from '@/components/media-card'

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch {
    return fallback
  }
}

function Row({ title, kicker, items, type }: { title: string; kicker?: string; items: MediaItem[]; type: 'movie' | 'series' }) {
  if (items.length === 0) return null
  return (
    <section className="mt-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          {kicker && <p className="mb-1 text-xs font-semibold uppercase tracking-[.18em] text-primary">{kicker}</p>}
          <h2 className="font-display text-2xl font-bold">{title}</h2>
        </div>
        <Link href={`/explore?type=${type}`} className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
          See all <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.slice(0, 5).map(item => (
          <MediaCard key={item.id} item={item} type={type} />
        ))}
      </div>
    </section>
  )
}

export default async function HomePage() {
  const [moviesData, seriesData] = await Promise.all([
    safe(api.movies('ordering=-rating'), [] as MediaItem[]),
    safe(api.series('ordering=-rating'), [] as MediaItem[]),
  ])
  const movies = unwrapList(moviesData)
  const series = unwrapList(seriesData)
  const featured = movies[0] ?? series[0]
  const offline = movies.length === 0 && series.length === 0

  return (
    <AppChrome>
      {featured ? (
        <section className="hero-grid relative min-h-[430px] overflow-hidden rounded-2xl border border-border bg-card p-5 sm:rounded-3xl sm:p-7 md:min-h-[390px] md:p-12">
          {mediaImage(featured, 'backdrop') && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaImage(featured, 'backdrop') || '/placeholder.svg'} alt={mediaTitle(featured)} className="absolute inset-0 size-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-transparent" />
          <div className="relative flex min-h-[310px] max-w-xl flex-col justify-end">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Featured</span>
              {mediaYear(featured) && <span className="text-xs text-muted-foreground">{mediaYear(featured)}</span>}
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-balance md:text-6xl">{mediaTitle(featured)}</h1>
            {mediaDescription(featured) && <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground line-clamp-3">{mediaDescription(featured)}</p>}
            <div className="mt-6 flex items-center gap-3">
              <Link
                href={`/watch/${movies[0] ? 'movie' : 'series'}/${featured.id}`}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"
              >
                <Play size={16} fill="currentColor" /> Watch now
              </Link>
              <Link href="/explore" className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-secondary">
                <Plus size={16} /> Browse all
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border p-12 text-center">
          <h1 className="font-display text-3xl font-bold">Welcome to Streamora</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {offline
              ? 'The catalog is currently unreachable. Please verify the API connection and refresh.'
              : 'Start exploring movies and series.'}
          </p>
          <Link href="/explore" className="mt-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
            Explore catalog
          </Link>
        </section>
      )}

      <Row title="Trending movies" kicker="Curated for you" items={movies} type="movie" />
      <Row title="Popular series" kicker="Binge-worthy" items={series} type="series" />
      <Row title="More to watch" items={movies.slice(5)} type="movie" />
    </AppChrome>
  )
}
