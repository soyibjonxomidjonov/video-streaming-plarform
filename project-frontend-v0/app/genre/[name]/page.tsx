import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { api, unwrapList, type MediaItem } from '@/lib/api'
import AppChrome from '@/components/app-chrome'
import MediaCard from '@/components/media-card'

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch { return fallback }
}

type Props = { params: Promise<{ name: string }> }

export async function generateMetadata({ params }: Props) {
  const { name } = await params
  const decoded = decodeURIComponent(name)
  return { title: `${decoded} — S-M Janr` }
}

export default async function GenreDetailPage({ params }: Props) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const [moviesData, seriesData] = await Promise.all([
    safe(api.movies(`genre_name=${encodeURIComponent(decodedName)}`), []),
    safe(api.series(`genre_name=${encodeURIComponent(decodedName)}`), []),
  ])

  const movies = unwrapList(moviesData) as MediaItem[]
  const series = unwrapList(seriesData) as MediaItem[]
  const total = movies.length + series.length

  return (
    <AppChrome>
      <div className="mb-6 flex flex-col gap-2">
        <Link href="/genres" className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <ArrowLeft size={14} /> Barcha janrlar
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
          Janr bo&apos;yicha
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{decodedName}</h1>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center">
          <p className="font-display text-lg font-bold">&quot;{decodedName}&quot; janrida kontent topilmadi</p>
          <Link href="/movies" className="mt-4 text-sm font-semibold" style={{ color: '#f5a623' }}>
            Barcha filmlarni ko&apos;rish →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {movies.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-bold">Filmlar ({movies.length})</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {movies.map(movie => (
                  <MediaCard key={movie.id} item={movie} type="movie" />
                ))}
              </div>
            </section>
          )}

          {series.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-bold">Seriallar ({series.length})</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {series.map(item => (
                  <MediaCard key={item.id} item={item} type="series" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppChrome>
  )
}
