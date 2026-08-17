import React, { Suspense } from 'react'
import SearchClient from './search-client'

export const metadata = {
  title: 'Semantik va Matnli Qidiruv — StreamVibe',
  description: 'Filmlar va seriallarni nomi, tavsifi yoki semantik ma\'nosi bo\'yicha qidiring.',
}

export default function SearchPage() {
  return (
    <div className="w-full min-w-0">
      <div className="mb-6">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00FFA3]">
          AQLLI QIDIRUV (AI &amp; SEMANTIC)
        </p>
        <h1 className="font-display text-2xl font-black text-[#F8FAFC] sm:text-3xl">
          Semantik va Aniq Qidiruv
        </h1>
      </div>
      <Suspense fallback={<SearchSkeleton />}>
        <SearchClient />
      </Suspense>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="skeleton h-14 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
