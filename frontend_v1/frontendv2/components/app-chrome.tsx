import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

/**
 * ConsumerChrome — layout shell for (consumer) route group only.
 * Renders: Desktop Sidebar (sticky) + Header (sticky) + Main content.
 * This is a Server Component — no 'use client', no usePathname needed.
 * Watch pages use their own (watch)/layout.tsx without chrome.
 * Auth pages use their own (auth)/layout.tsx without chrome.
 */
export default function ConsumerChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden text-[#F8FAFC] lg:grid lg:grid-cols-[5.5rem_1fr] bg-transparent">
      {/* Desktop Sidebar — strict grid column, NEVER overlaps content */}
      <Sidebar />

      {/* Main content column */}
      <div className="min-w-0 w-full flex flex-col">
        {/* Sticky header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 w-full min-w-0 max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 py-6 sm:py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-16">
          {children}
        </main>
      </div>
    </div>
  )
}
