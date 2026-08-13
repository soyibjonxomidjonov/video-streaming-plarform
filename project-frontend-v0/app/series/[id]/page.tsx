import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Play, Star, TvMinimal } from 'lucide-react'
import { api, mediaDescription, mediaImage, mediaRating, mediaTitle, mediaYear, unwrapList, type Episode } from '@/lib/api'
import AppChrome from '@/components/app-chrome'
import SeriesDetailClient from './series-detail-client'

async function safe<T>(promise: Promise<T>, fallback: T | null): Promise<T | null> {
  try { return await promise } catch { return fallback }
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const series = await safe(api.serie(id), null)
  if (!series) return { title: 'Serial topilmadi' }
  return {
    title: mediaTitle(series),
    description: mediaDescription(series).slice(0, 155),
    openGraph: { images: mediaImage(series) ? [mediaImage(series)] : [] },
  }
}

export default async function SeriesDetailPage({ params }: Props) {
  const { id } = await params
  const series = await safe(api.serie(id), null)
  if (!series) notFound()

  const [episodesData, commentsData] = await Promise.all([
    safe(api.seriesEpisodes(id), []),
    safe(api.seriesComments(id), []),
  ])
  const episodes = series.episodes ?? unwrapList(episodesData ?? []) as Episode[]
  const comments = unwrapList(commentsData ?? [])

  const image = mediaImage(series)
  const backdrop = mediaImage(series, 'backdrop')
  const rating = mediaRating(series)
  const year = mediaYear(series)
  const firstEp = episodes[0]

  return (
    <AppChrome>
      {/* HERO */}
      <div className="relative -mx-3 -mt-4 sm:-mx-5 sm:-mt-6 lg:-mx-8 lg:-mt-6">
        <div className="relative h-[240px] overflow-hidden rounded-b-3xl sm:h-[320px] md:h-[380px]">
          {backdrop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backdrop} alt="" className="size-full object-cover opacity-35" style={{ objectPosition: 'center 20%' }} />
          ) : (
            <div className="size-full bg-gradient-to-br from-primary/10 via-surface to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="-mt-20 relative sm:-mt-28 md:-mt-36">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Poster */}
          <div className="mx-auto w-36 shrink-0 sm:mx-0 sm:w-48 md:w-56">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl" style={{ aspectRatio: '2/3' }}>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={mediaTitle(series)} className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center">
                  <TvMinimal size={32} className="text-primary/60" />
                  <span className="text-xs font-semibold text-muted-foreground">{mediaTitle(series)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                Serial
              </span>
              {year && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar size={13} /> {year}
                </span>
              )}
              {episodes.length > 0 && (
                <span className="text-sm font-semibold text-muted-foreground">
                  {episodes.length} qism
                </span>
              )}
              {rating !== null && (
                <span className="flex items-center gap-1 text-sm font-bold text-accent">
                  <Star size={13} className="fill-accent" /> {rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl font-black tracking-tight text-balance text-foreground sm:text-4xl">
              {mediaTitle(series)}
            </h1>

            {/* Genres */}
            {series.genres && series.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {series.genres.map(g => (
                  <Link
                    key={g.id}
                    href={`/genre/${encodeURIComponent(g.name)}`}
                    className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-primary/20"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            {mediaDescription(series) && (
              <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">
                {mediaDescription(series)}
              </p>
            )}

            {/* CTA */}
            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href={firstEp ? `/watch/series/${id}?ep=${firstEp.id}` : `/watch/series/${id}`}
                id="watch-series-btn"
                className="flex items-center gap-2.5 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary-hover active:scale-95"
              >
                <Play size={17} fill="currentColor" /> Ko&apos;rishni boshlash
              </Link>
            </div>
          </div>
        </div>

        {/* Client component for Episodes list, Favorites, Rating & Comments */}
        <div className="mt-8">
          <SeriesDetailClient
            id={id}
            title={mediaTitle(series)}
            episodes={episodes}
            initialComments={comments}
          />
        </div>
      </div>
    </AppChrome>
  )
}
