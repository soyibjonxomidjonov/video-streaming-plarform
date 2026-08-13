import { Suspense } from 'react'
import AppChrome from '@/components/app-chrome'
import SearchClient from './search-client'

export const metadata = { title: 'Qidiruv — S-M' }

export default function SearchPage() {
  return (
    <AppChrome>
      <div className="mb-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
          Aqlli Qidiruv
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Semantik va Aniq Qidiruv</h1>
      </div>
      <Suspense fallback={<SearchSkeleton />}>
        <SearchClient />
      </Suspense>
    </AppChrome>
  )
}

function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
