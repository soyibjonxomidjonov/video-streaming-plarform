import Link from 'next/link'
import { ChevronRight, Film, Play, TvMinimal } from 'lucide-react'
import { api, mediaDescription, mediaImage, mediaTitle, mediaYear, unwrapList, type MediaItem, type Genre } from '@/lib/api'
import AppChrome from '@/components/app-chrome'
import MediaCard from '@/components/media-card'

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch { return fallback }
}

function Row({
  title,
  kicker,
  items,
  type,
  href,
}: {
  title: string
  kicker?: string
  items: MediaItem[]
  type: 'movie' | 'series'
  href: string
}) {
  if (items.length === 0) return null
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          {kicker && (
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-primary">
              {kicker}
            </p>
          )}
          <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
        </div>
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          Barchasini ko&apos;r <ChevronRight size={15} />
        </Link>
      </div>
      {/* Horizontal scroll row (mobile) / grid (desktop) */}
      <div className="scroll-row lg:grid lg:grid-cols-5 lg:gap-4">
        {items.slice(0, 10).map(item => (
          <div key={item.id} className="w-[42vw] max-w-[200px] sm:w-[30vw] lg:w-auto">
            <MediaCard item={item} type={type} />
          </div>
        ))}
      </div>
    </section>
  )
}

function GenreChip({ genre }: { genre: Genre }) {
  return (
    <Link
      href={`/genre/${encodeURIComponent(genre.name)}`}
      className="flex shrink-0 items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
    >
      {genre.name}
    </Link>
  )
}

export default async function HomePage() {
  const [moviesData, seriesData, genresData] = await Promise.all([
    safe(api.movies('ordering=-created_at'), [] as MediaItem[]),
    safe(api.series('ordering=-created_at'), [] as MediaItem[]),
    safe(api.genres(), [] as Genre[]),
  ])
  const movies = unwrapList(moviesData)
  const series = unwrapList(seriesData)
  const genres = unwrapList(genresData)
  const featured = movies[0] ?? series[0]
  const offline = movies.length === 0 && series.length === 0

  return (
    <AppChrome>
      {/* ───── HERO BANNER ───── */}
      {featured ? (
        <section
          id="hero"
          className="relative min-h-[360px] overflow-hidden rounded-2xl border border-border bg-surface sm:min-h-[440px] sm:rounded-3xl md:min-h-[500px]"
        >
          {/* Backdrop image or textured fallback */}
          {mediaImage(featured, 'backdrop') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaImage(featured, 'backdrop')}
              alt={mediaTitle(featured)}
              className="absolute inset-0 size-full object-cover opacity-40"
              style={{ objectPosition: 'center top' }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 15% 20%, rgba(242,165,26,0.16), transparent 45%), radial-gradient(circle at 85% 75%, rgba(255,209,102,0.10), transparent 50%)',
              }}
            />
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, rgba(11,12,16,0.97) 0%, rgba(11,12,16,0.82) 48%, rgba(11,12,16,0.35) 100%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(11,12,16,0.9) 0%, transparent 55%)' }}
          />

          {/* Content */}
          <div className="relative flex min-h-[360px] max-w-2xl flex-col justify-end p-5 sm:min-h-[440px] sm:p-9 md:min-h-[500px] md:p-12">
            {/* Badges */}
            <div className="mb-4 flex items-center gap-2.5">
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                Tavsiya etiladi
              </span>
              {mediaYear(featured) && (
                <span className="text-xs font-medium text-muted-foreground">{mediaYear(featured)}</span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl font-black tracking-tight text-balance text-foreground sm:text-4xl md:text-5xl">
              {mediaTitle(featured)}
            </h1>

            {/* Description */}
            {mediaDescription(featured) && (
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground line-clamp-2 sm:line-clamp-3">
                {mediaDescription(featured)}
              </p>
            )}

            {/* CTA buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={`/watch/${movies[0] ? 'movie' : 'series'}/${featured.id}`}
                id="hero-watch-btn"
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover active:scale-95"
              >
                <Play size={16} fill="currentColor" />
                Ko&apos;rish
              </Link>
              <Link
                href={movies[0] ? `/movie/${featured.id}` : `/series/${featured.id}`}
                id="hero-detail-btn"
                className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-5 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-surface-2"
              >
                Batafsil
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border p-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Film size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">S-M ga xush kelibsiz</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {offline
              ? 'Katalogga ulanib bo\'lmadi. API ulanishni tekshirib, sahifani yangilang.'
              : 'Film va seriallarni kashf qiling.'}
          </p>
          <Link
            href="/movies"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover"
          >
            Filmlarni ko&apos;rish
          </Link>
        </section>
      )}

      {/* ───── JANRLAR ───── */}
      {genres.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3.5 font-display text-lg font-bold text-foreground sm:text-xl">Janrlar</h2>
          <div className="scroll-row lg:flex lg:flex-wrap lg:gap-2.5">
            {genres.slice(0, 12).map(genre => (
              <GenreChip key={genre.id} genre={genre} />
            ))}
          </div>
        </section>
      )}

      {/* ───── FILMLAR QATORI ───── */}
      <Row
        title="Yangi filmlar"
        kicker="Eng so'nggi"
        items={movies}
        type="movie"
        href="/movies"
      />

      {/* ───── SERIALLAR QATORI ───── */}
      <Row
        title="Mashhur seriallar"
        kicker="Ko'p ko'rilgan"
        items={series}
        type="series"
        href="/series"
      />

      {/* ───── YANA KO'PROQ ───── */}
      {movies.length > 5 && (
        <Row
          title="Ko'proq filmlar"
          items={movies.slice(5)}
          type="movie"
          href="/movies"
        />
      )}

      {/* ───── VOICE CTA (mobil uchun) ───── */}
      <section className="mt-12 rounded-2xl border border-primary/15 bg-primary/6 p-5 sm:p-7 lg:hidden">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary">
            <TvMinimal size={22} className="text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">Ovoz bilan boshqaring</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              &quot;Pauza&quot;, &quot;Oldinga 30 soniya&quot;, &quot;Interstellar qidir&quot; — shunchaki gapiring
            </p>
          </div>
        </div>
      </section>
    </AppChrome>
  )
}
