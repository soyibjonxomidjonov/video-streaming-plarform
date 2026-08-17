'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWatchPage = pathname.startsWith('/watch')

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#070A0C] text-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Desktop Sidebar — sticky flex sibling, NEVER overlaps content */}
      <Sidebar />

      {/* Main content column — stretches 100% remaining viewport width */}
      <div className="flex-1 min-w-0 w-full flex flex-col">
        {/* Sticky header (hidden on watch page) */}
        {!isWatchPage && <Header />}

        {/* Content area */}
        <main
          className={`flex-1 w-full min-w-0 ${
            isWatchPage
              ? 'p-0'
              : 'max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 py-6 sm:py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-16'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
