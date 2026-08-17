import React, { Suspense } from 'react'
import { api, unwrapList, type Genre } from '@/lib/api'
import MoviesClient from './movies-client'

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch { return fallback }
}

export const metadata = {
  title: 'Filmlar Katalogi — S-M Stream',
  description: 'Barcha yangi va mashhur filmlarni tomosha qiling.',
}

export default async function MoviesPage() {
  const genresData = await safe(api.genres(), [])
  const genres = unwrapList(genresData) as Genre[]

  return (
    <div className="p-4 sm:p-6 lg:p-8">


      <Suspense fallback={<GridSkeleton />}>
        <MoviesClient genres={genres} />
      </Suspense>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-2xl border border-[rgba(0,229,153,0.1)] bg-[#101514] p-3">
          <div className="skeleton aspect-[2/3] rounded-xl" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  )
}
