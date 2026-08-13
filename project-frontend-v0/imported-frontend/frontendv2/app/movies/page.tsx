import { Suspense } from 'react'
import { api, unwrapList, type Genre } from '@/lib/api'
import AppChrome from '@/components/app-chrome'
import MoviesClient from './movies-client'

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch { return fallback }
}

export const metadata = { title: 'Filmlar' }

export default async function MoviesPage() {
  const genresData = await safe(api.genres(), [])
  const genres = unwrapList(genresData) as Genre[]

  return (
    <AppChrome>
      <div className="mb-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
          Katalog
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Filmlar</h1>
      </div>
      <Suspense fallback={<GridSkeleton />}>
        <MoviesClient genres={genres} />
      </Suspense>
    </AppChrome>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="skeleton aspect-[2/3] rounded-2xl" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  )
}
