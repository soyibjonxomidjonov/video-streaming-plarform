import React, { Suspense } from 'react'
import { api, unwrapList, type Genre } from '@/lib/api'
import SeriesClient from './series-client'

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch { return fallback }
}

export const metadata = {
  title: 'Seriallar Katalogi — StreamVibe',
  description: 'Mashhur multiseriallar va yangi qismlarni tomosha qiling.',
}

export default async function SeriesPage() {
  const genresData = await safe(api.genres(), [])
  const genres = unwrapList(genresData) as Genre[]

  return (
    <Suspense fallback={<GridSkeleton />}>
      <SeriesClient genres={genres} />
    </Suspense>
  )
}

function GridSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-44 rounded-xl skeleton" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] w-full rounded-2xl skeleton" />
        ))}
      </div>
    </div>
  )
}
