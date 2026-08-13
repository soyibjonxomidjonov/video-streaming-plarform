import Link from 'next/link'
import { Clapperboard } from 'lucide-react'
import { api, unwrapList, type Genre } from '@/lib/api'
import AppChrome from '@/components/app-chrome'

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch { return fallback }
}

export const metadata = { title: 'Barcha Janrlar — S-M' }

export default async function GenresPage() {
  const genresData = await safe(api.genres(), [])
  const genres = unwrapList(genresData) as Genre[]

  return (
    <AppChrome>
      <div className="mb-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
          Katalog
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Barcha Janrlar</h1>
      </div>

      {genres.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center">
          <Clapperboard size={36} className="mb-2 text-muted-foreground/40" />
          <p className="font-display text-lg font-bold">Janrlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {genres.map(genre => (
            <Link
              key={genre.id}
              href={`/genre/${encodeURIComponent(genre.name)}`}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center transition hover:border-amber-400/50 hover:scale-105"
              style={{ background: '#16161a', border: '1px solid #2a2a30' }}
            >
              <div
                className="flex size-12 items-center justify-center rounded-xl text-black transition group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
              >
                <Clapperboard size={22} fill="currentColor" />
              </div>
              <span className="font-display text-base font-bold group-hover:text-amber-400 transition">
                {genre.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppChrome>
  )
}
