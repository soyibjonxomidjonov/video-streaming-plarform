'use client'

import React, { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Mic, X, ShieldAlert, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'
import { Logo } from '@/components/ui/logo'

export function Header() {
  const router = useRouter()
  const { isAuthenticated, user, isAdmin } = useAuth()
  const { enabled: voiceEnabled, toggle: toggleVoice } = useVoiceAssistant()

  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  return (
    <header className="h-20 px-6 lg:px-12 sticky top-0 z-30 backdrop-blur-xl bg-[#070A0C]/85 border-b border-[#00FFA3]/15 flex items-center justify-between w-full">
      {/* Mobile Logo */}
      <div className="flex items-center gap-2 lg:hidden mr-4 shrink-0">
        <Link href="/" prefetch={true} aria-label="Bosh sahifa">
          <Logo className="size-10" />
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 w-full flex justify-center lg:justify-start">
        <div
          className={`h-12 sm:h-14 max-w-2xl w-full mx-6 rounded-2xl bg-[#0F171A] border px-5 text-base flex items-center gap-3 transition-all duration-200 ${
            searchFocused
              ? 'border-[#00FFA3] shadow-[0_0_16px_rgba(0,255,163,0.2)] ring-1 ring-[#00FFA3]/30'
              : 'border-[#00FFA3]/20 hover:border-[#00FFA3]/40'
          }`}
        >
          <Search size={20} className="shrink-0 text-[#64748B]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Film, serial yoki semantik qidiruv..."
            className="w-full bg-transparent text-base text-[#F8FAFC] outline-none placeholder:text-[#64748B] font-medium border-none shadow-none ring-0 focus:ring-0 focus:shadow-none h-full"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#64748B] hover:text-[#F8FAFC] transition p-1 shrink-0"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={toggleVoice}
            className={`rounded-xl p-2 transition shrink-0 ${
              voiceEnabled ? 'animate-pulse text-[#00FFA3] bg-[rgba(0,255,163,0.12)]' : 'text-[#64748B] hover:text-[#00FFA3]'
            }`}
            title="Ovozli qidiruv"
          >
            <Mic size={20} />
          </button>
        </div>
      </form>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-2 shrink-0">
        {isAdmin && (
          <Link
            href="/admin"
            prefetch={true}
            className="hidden md:flex items-center gap-2 rounded-xl border border-[rgba(0,255,163,0.25)] bg-[rgba(0,255,163,0.08)] px-4 py-2.5 text-sm font-bold text-[#00FFA3] transition hover:bg-[rgba(0,255,163,0.18)]"
          >
            <ShieldAlert size={18} /> Admin
          </Link>
        )}

        <button
          onClick={toggleVoice}
          className="hidden lg:flex items-center gap-2 rounded-xl border border-[rgba(0,255,163,0.2)] bg-[rgba(0,255,163,0.08)] px-4 py-2.5 text-sm font-bold text-[#00FFA3] shadow-[0_0_10px_rgba(0,255,163,0.12)] transition hover:bg-[rgba(0,255,163,0.18)] active:scale-95"
        >
          <Sparkles size={18} />
          <span>AI Voice</span>
        </button>

        {!isAuthenticated ? (
          <Link
            href="/login"
            prefetch={true}
            className="rounded-xl bg-[#00FFA3] px-6 py-3 text-base font-bold text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.3)] transition hover:bg-[#1AFFA8] hover:scale-105 active:scale-95"
          >
            Kirish
          </Link>
        ) : (
          <Link
            href="/profile"
            prefetch={true}
            className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0D4D38] to-[#00FFA3] font-display text-base font-extrabold text-[#070A0C] ring-2 ring-[#00FFA3]/30 shadow-[0_0_15px_rgba(0,255,163,0.3)] transition hover:scale-105"
            title="Profil"
          >
            {(user?.first_name ? user.first_name[0] : user?.email?.slice(0, 2) || 'SM').toUpperCase()}
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header
