'use client'

import React from 'react'
import Link from 'next/link'
import { Film, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      {/* Icon */}
      <div className="flex size-24 items-center justify-center rounded-3xl mb-6 bg-[rgba(0,255,163,0.1)] border border-[rgba(0,255,163,0.25)] text-[#00FFA3] shadow-[0_0_30px_rgba(0,255,163,0.15)]">
        <Film size={42} aria-hidden="true" />
      </div>

      {/* 404 number */}
      <h1 className="font-display text-6xl font-black sm:text-8xl text-[#00FFA3] text-glow mb-2">
        404
      </h1>

      {/* Title */}
      <h2 className="font-display text-2xl font-bold text-[#F8FAFC] mb-3">
        Sahifa topilmadi
      </h2>

      {/* Description */}
      <p className="max-w-sm text-sm text-[#64748B] leading-relaxed mb-8">
        Siz qidirayotgan sahifa o&apos;chirilgan, nomi o&apos;zgartirilgan yoki vaqtincha mavjud emas.
      </p>

      {/* CTA */}
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-2xl bg-[#00FFA3] px-8 py-4 text-sm font-bold text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.35)] transition hover:bg-[#1AFFA8] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFA3]"
      >
        <Home size={18} aria-hidden="true" />
        Bosh sahifaga qaytish
      </Link>
    </div>
  )
}
