import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Play, Star } from 'lucide-react'
import { api, mediaDescription, mediaImage, mediaRating, mediaTitle, mediaYear, unwrapList, formatDuration } from '@/lib/api'
import AppChrome from '@/components/app-chrome'
import MovieDetailClient from './movie-detail-client'

async function safe<T>(promise: Promise<T>, fallback: T | null): Promise<T | null> {
  try { return await promise } catch { return fallback }
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const movie = await safe(api.movie(id), null)
  if (!movie) return { title: 'Film topilmadi' }
  return {
    title: mediaTitle(movie),
    description: mediaDescription(movie).slice(0, 155),
    openGraph: { images: mediaImage(movie) ? [mediaImage(movie)] : [] },
  }
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params
  const movie = await safe(api.movie(id), null)
  if (!movie) notFound()

  const [commentsData] = await Promise.all([
    safe(api.movieComments(id), []),
  ])
  const comments = unwrapList(commentsData ?? [])

  const image = mediaImage(movie)
  const backdrop = mediaImage(movie, 'backdrop')
  const rating = mediaRating(movie)
  const year = mediaYear(movie)
  const duration = movie.duration_seconds
  const streamUrl = api.movieStream(id)

  return (
    <AppChrome>
      {/* HERO */}
      <div className="relative -mx-3 -mt-4 sm:-mx-5 sm:-mt-6 lg:-mx-8 lg:-mt-6">
        <div className="relative h-[240px] sm:h-[320px] md:h-[380px] overflow-hidden rounded-b-3xl">
          {backdrop ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backdrop} alt="" className="size-full object-cover opacity-35" style={{ objectPosition: 'center 20%' }} />
          ) : (
            <div className="size-full bg-gradient-to-br from-violet-950/40 via-surface to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="-mt-20 relative sm:-mt-28 md:-mt-36">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Poster */}
          <div className="mx-auto w-36 shrink-0 sm:mx-0 sm:w-48 md:w-56">
            <div className="overflow-hidden rounded-2xl border border-border shadow-2xl bg-surface" style={{ aspectRatio: '2/3' }}>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={mediaTitle(movie)} className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center">
                  <Play size={32} className="text-violet-400/60" />
                  <span className="text-xs text-slate-400 font-semibold">{mediaTitle(movie)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-violet-600 text-white">
                Film
              </span>
              {year && (
                <span className="flex items-center gap-1 text-sm text-slate-400">
                  <Calendar size={13} /> {year}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1 text-sm text-slate-400">
                  <Clock size={13} /> {formatDuration(duration)}
                </span>
              )}
              {rating !== null && (
                <span className="flex items-center gap-1 text-sm font-bold text-amber-400">
                  <Star size={13} className="fill-amber-400" /> {rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl font-black tracking-tight text-balance text-white sm:text-4xl">
              {mediaTitle(movie)}
            </h1>

            {/* Genres (FIXED UNIQUE KEY PROP) */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((g, idx) => {
                  const genreId = typeof g === 'object' && g.id ? g.id : idx
                  const genreName = typeof g === 'object' ? g.name : String(g)
                  return (
                    <Link
                      key={`movie-genre-${genreId}-${idx}`}
                      href={`/genre/${encodeURIComponent(genreName)}`}
                      className="rounded-lg px-3 py-1 text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 transition"
                    >
                      {genreName}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Description */}
            {mediaDescription(movie) && (
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                {mediaDescription(movie)}
              </p>
            )}

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href={`/watch/movie/${id}`}
                id="watch-movie-btn"
                className="flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 transition shadow-lg shadow-violet-600/25 active:scale-95"
              >
                <Play size={17} fill="currentColor" /> Ko&apos;rishni boshlash
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive section */}
        <div className="mt-10">
          <MovieDetailClient
            id={id}
            type="movie"
            streamUrl={streamUrl}
            title={mediaTitle(movie)}
            initialComments={comments}
          />
        </div>
      </div>
    </AppChrome>
  )
}
