'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell, Clock3, Compass, Film, Heart, Home as HomeIcon,
  LayoutDashboard, Menu, Mic, Play, Search, Settings, Sparkles, TvMinimal, User, X
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'

function NavLink({
  icon: Icon,
  label,
  href,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  href: string
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
        active
          ? 'bg-violet-600/15 text-violet-400 border border-violet-500/30'
          : 'text-slate-400 hover:bg-surface-2 hover:text-white border border-transparent'
      }`}
    >
      <Icon size={16} className="shrink-0" />
      <span>{label}</span>
      {active && <span className="ml-auto size-1.5 rounded-full bg-violet-400" />}
    </Link>
  )
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, isAdmin } = useAuth()
  const { enabled: voiceEnabled, toggle: toggleVoice } = useVoiceAssistant()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setQuery('')
      setSidebarOpen(false)
    }
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const closeSidebar = () => setSidebarOpen(false)

  const userInitials = (user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ''}`
    : user?.email?.slice(0, 2) ?? 'SM'
  ).toUpperCase()

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'max(4.5rem, calc(4.5rem + env(safe-area-inset-bottom)))' }}>
      {/* ───── CLEAN HEADER ───── */}
      <header
        className="safe-top sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/80 px-3 sm:px-6 lg:h-16 lg:px-8"
        style={{ background: 'rgba(9, 9, 11, 0.92)', backdropFilter: 'blur(16px)' }}
      >
        {/* Mobile menu toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-slate-400 hover:bg-surface-2 hover:text-white lg:hidden"
          aria-label="Menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex size-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/30">
            <Play size={15} fill="currentColor" className="translate-x-0.5" />
          </div>
          <span className="font-display text-xl font-black tracking-tight text-white">
            S<span className="text-violet-400">-</span>M
          </span>
        </Link>

        {/* Center Search Input (Desktop) */}
        <form onSubmit={submitSearch} className="mx-auto hidden w-full max-w-lg md:block">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 transition ${
              searchFocused ? 'border-violet-500 bg-surface-2 shadow-lg shadow-violet-500/10' : 'border-border bg-surface'
            }`}
          >
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Film, serial yoki janr qidiring..."
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
                <X size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={toggleVoice}
              aria-label="Ovozli yordamchi"
              className={`rounded-lg p-1 transition ${
                voiceEnabled ? 'text-violet-400 animate-pulse' : 'text-slate-400 hover:text-violet-400'
              }`}
            >
              <Mic size={15} />
            </button>
          </div>
        </form>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-xl bg-violet-600/15 border border-violet-500/30 px-3 py-1.5 text-xs font-bold text-violet-400 transition hover:bg-violet-600/25 sm:flex"
            >
              <LayoutDashboard size={14} /> Admin
            </Link>
          )}

          <button className="rounded-xl p-2 text-slate-400 hover:bg-surface-2 hover:text-white" aria-label="Notifications">
            <Bell size={18} />
          </button>

          {isAuthenticated ? (
            <Link
              href="/profile"
              className="flex size-8 items-center justify-center rounded-full bg-violet-600 font-display text-xs font-bold text-white shadow-md"
            >
              {userInitials}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-500 active:scale-95"
            >
              Kirish
            </Link>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-xs lg:hidden"
            onClick={closeSidebar}
            aria-hidden
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-60 border-r border-border bg-background p-4 transition-transform duration-200 lg:sticky lg:top-16 lg:translate-x-0 lg:block lg:h-[calc(100vh-64px)] lg:pt-6`}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="font-display font-bold text-white">Menyu</span>
            <button onClick={closeSidebar} className="text-slate-400"><X size={18} /></button>
          </div>

          <form onSubmit={submitSearch} className="mb-4 lg:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Qidirish..."
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </form>

          <nav className="space-y-4">
            <div>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Asosiy</p>
              <div className="flex flex-col gap-0.5">
                <NavLink icon={HomeIcon} label="Bosh sahifa" href="/" active={isActive('/') && !isActive('/movies') && !isActive('/series')} onClick={closeSidebar} />
                <NavLink icon={Film} label="Filmlar" href="/movies" active={isActive('/movies')} onClick={closeSidebar} />
                <NavLink icon={TvMinimal} label="Seriallar" href="/series" active={isActive('/series')} onClick={closeSidebar} />
                <NavLink icon={Compass} label="Janrlar" href="/genres" active={isActive('/genres')} onClick={closeSidebar} />
                <NavLink icon={Search} label="Qidiruv" href="/search" active={isActive('/search')} onClick={closeSidebar} />
              </div>
            </div>

            {isAuthenticated && (
              <div>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Kutubxona</p>
                <div className="flex flex-col gap-0.5">
                  <NavLink icon={Heart} label="Sevimlilar" href="/favorites" active={isActive('/favorites')} onClick={closeSidebar} />
                  <NavLink icon={Clock3} label="Tomosha tarixi" href="/history" active={isActive('/history')} onClick={closeSidebar} />
                  <NavLink icon={User} label="Profil" href="/profile" active={isActive('/profile')} onClick={closeSidebar} />
                  <NavLink icon={Settings} label="Sozlamalar" href="/settings" active={isActive('/settings')} onClick={closeSidebar} />
                </div>
              </div>
            )}
          </nav>

          <div
            className="mt-8 hidden rounded-2xl p-4 lg:block"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Sparkles size={18} className="mb-2 text-violet-400" />
            <p className="text-xs font-bold text-white">Ovozli boshqaruv</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Kino va seriallarni ovoz bilan toping hamda boshqaring.
            </p>
            <button
              onClick={toggleVoice}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-violet-400 transition hover:text-violet-300"
            >
              <Mic size={13} />
              {voiceEnabled ? 'Ovoz faol' : 'Ishga tushirish'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-border/80 bg-background/95 backdrop-blur-xl lg:hidden safe-bottom">
        <Link href="/" className={`flex flex-col items-center gap-0.5 ${isActive('/') && !isActive('/movies') && !isActive('/series') ? 'text-violet-400' : 'text-slate-400'}`}>
          <HomeIcon size={18} />
          <span className="text-[10px] font-semibold">Bosh</span>
        </Link>
        <Link href="/movies" className={`flex flex-col items-center gap-0.5 ${isActive('/movies') ? 'text-violet-400' : 'text-slate-400'}`}>
          <Film size={18} />
          <span className="text-[10px] font-semibold">Filmlar</span>
        </Link>
        <button
          onClick={toggleVoice}
          className={`flex size-10 items-center justify-center rounded-full transition ${voiceEnabled ? 'bg-violet-600 text-white animate-pulse' : 'bg-surface border border-slate-700 text-violet-400'}`}
          aria-label="Ovoz"
        >
          <Mic size={18} />
        </button>
        <Link href={isAuthenticated ? '/favorites' : '/login'} className={`flex flex-col items-center gap-0.5 ${isActive('/favorites') ? 'text-violet-400' : 'text-slate-400'}`}>
          <Heart size={18} />
          <span className="text-[10px] font-semibold">Sevimli</span>
        </Link>
        <Link href={isAuthenticated ? '/profile' : '/login'} className={`flex flex-col items-center gap-0.5 ${isActive('/profile') ? 'text-violet-400' : 'text-slate-400'}`}>
          <User size={18} />
          <span className="text-[10px] font-semibold">Profil</span>
        </Link>
      </nav>
    </div>
  )
}
