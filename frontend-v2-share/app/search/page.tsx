import React, { Suspense } from 'react'
import SearchClient from './search-client'

export const metadata = {
  title: 'Semantik va Matnli Qidiruv — S-M Stream',
  description: 'Filmlar va seriallarni nomi, tavsifi yoki semantik ma\'nosi bo\'yicha qidiring.',
}

export default function SearchPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00e599]">
          AQLLI QIDIRUV (AI & SEMANTIC)
        </p>
        <h1 className="font-display text-2xl font-black text-[#f5f7f6] sm:text-3xl">
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
