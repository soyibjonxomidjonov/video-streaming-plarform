'use client'

import React from 'react'
import Link from 'next/link'
import { Film, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-[#080a0a]">
      <div className="flex size-20 items-center justify-center rounded-3xl mb-4 bg-[rgba(0,229,153,0.1)] border border-[rgba(0,229,153,0.25)] text-[#00e599] shadow-[0_0_25px_rgba(0,229,153,0.2)]">
        <Film size={36} />
      </div>
      <h1 className="font-display text-5xl font-black sm:text-7xl text-[#00e599]">404</h1>
      <h2 className="mt-2 font-display text-xl font-bold text-[#f5f7f6]">Sahifa topilmadi</h2>
      <p className="mt-2 max-w-sm text-xs text-[#8c9994]">
        Siz qidirayotgan sahifa o&apos;chirilgan, nomi o&apos;zgartirilgan yoki vaqtincha mavjud emas.
      </p>

      <Link
        href="/"
        className="mt-6 flex items-center gap-2 rounded-2xl bg-[#00e599] px-7 py-3.5 text-xs font-bold text-[#080a0a] shadow-[0_0_20px_rgba(0,229,153,0.4)] transition hover:bg-[#1df2ad] active:scale-95"
      >
        <Home size={16} /> Bosh sahifaga qaytish
      </Link>
    </div>
  )
}
