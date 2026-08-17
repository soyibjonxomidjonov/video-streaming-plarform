'use client'

import React, { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Logo } from '@/components/ui/logo'

export function Header() {
  const router = useRouter()
  const { isAuthenticated, user, isAdmin } = useAuth()

  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const userInitials = (
    user?.first_name
      ? `${user.first_name[0]}${user.last_name?.[0] ?? ''}`
      : user?.email?.slice(0, 2) ?? 'SM'
  ).toUpperCase()

  return (
    <header
      className="h-[4.5rem] px-5 sm:px-8 lg:px-10 sticky top-0 z-30 w-full flex items-center justify-between gap-4"
      style={{
        background: 'rgba(7, 10, 12, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 255, 163, 0.1)',
      }}
    >
      {/* Mobile logo (hidden on desktop — sidebar has logo) */}
      <div className="flex items-center gap-2 lg:hidden shrink-0">
        <Link href="/" prefetch={true} aria-label="StreamVibe — Bosh sahifaga qaytish">
          <Logo className="size-9" />
        </Link>
      </div>

      {/* Search — stretches to fill center */}
      <form
        onSubmit={handleSearch}
        className="flex-1 min-w-0 flex justify-center"
        role="search"
        aria-label="Kontent qidirish"
      >
        <div
          className={`h-11 sm:h-12 w-full max-w-xl rounded-2xl bg-[#0F171A] border px-4 flex items-center gap-3 transition-all duration-200 ${
            searchFocused
              ? 'border-[#00FFA3] shadow-[0_0_16px_rgba(0,255,163,0.18)] ring-1 ring-[#00FFA3]/25'
              : 'border-[rgba(0,255,163,0.15)] hover:border-[rgba(0,255,163,0.35)]'
          }`}
        >
          <Search
            size={18}
            className="shrink-0 text-[#64748B]"
            aria-hidden="true"
          />
          <input
            id="header-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Film, serial yoki semantik qidiruv..."
            aria-label="Film yoki serial qidirish"
            autoComplete="off"
            className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#4B5563] font-medium border-none shadow-none ring-0 focus:ring-0 focus:shadow-none h-full"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#64748B] hover:text-[#F8FAFC] transition p-1 shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-[#00FFA3]"
              aria-label="Qidiruvni tozalash"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-3 shrink-0">
        {isAdmin && (
          <Link
            href="/admin"
            prefetch={true}
            aria-label="Admin panelga o'tish"
            className="hidden md:flex items-center gap-2 rounded-xl border border-[rgba(0,255,163,0.25)] bg-[rgba(0,255,163,0.08)] px-4 py-2 text-sm font-bold text-[#00FFA3] transition hover:bg-[rgba(0,255,163,0.18)] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#00FFA3]"
          >
            <ShieldAlert size={16} aria-hidden="true" />
            Admin
          </Link>
        )}

        {!isAuthenticated ? (
          <Link
            href="/login"
            prefetch={true}
            className="rounded-xl bg-[#00FFA3] px-5 py-2.5 text-sm font-bold text-[#070A0C] shadow-[0_0_18px_rgba(0,255,163,0.28)] transition hover:bg-[#1AFFA8] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFA3]"
          >
            Kirish
          </Link>
        ) : (
          <Link
            href="/profile"
            prefetch={true}
            aria-label={`Profil — ${user?.first_name ?? user?.email ?? 'Foydalanuvchi'}`}
            title="Profilim"
            className="flex size-10 items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr from-[#0D4D38] to-[#00FFA3] font-display text-sm font-extrabold text-[#070A0C] ring-2 ring-[#00FFA3]/25 shadow-[0_0_14px_rgba(0,255,163,0.28)] transition hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFA3]"
          >
            {user?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.picture} alt="Profil" className="size-full object-cover" />
            ) : (
              userInitials
            )}
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header
