import React, { Suspense } from 'react'
import { api, unwrapList, type Genre } from '@/lib/api'
import MoviesClient from './movies-client'

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch { return fallback }
}

export const metadata = {
  title: 'Filmlar Katalogi — StreamVibe',
  description: 'Barcha yangi va mashhur filmlarni tomosha qiling.',
}

function GridSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-40 rounded-xl skeleton" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] w-full rounded-2xl skeleton" />
        ))}
      </div>
    </div>
  )
}

export default async function MoviesPage() {
  const genresData = await safe(api.genres(), [])
  const genres = unwrapList(genresData) as Genre[]

  return (
    <Suspense fallback={<GridSkeleton />}>
      <MoviesClient genres={genres} />
    </Suspense>
  )
}
