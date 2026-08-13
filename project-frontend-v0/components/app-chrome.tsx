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
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
        active
          ? 'bg-primary/15 text-primary border border-primary/30'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground border border-transparent'
      }`}
    >
      <Icon size={17} className="shrink-0" />
      <span>{label}</span>
      {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
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
    <div className="min-h-screen overflow-x-clip bg-background" style={{ paddingBottom: 'max(4.5rem, calc(4.5rem + env(safe-area-inset-bottom)))' }}>
      {/* ───── HEADER ───── */}
      <header
        className="safe-top sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/80 px-3 sm:gap-3 sm:px-6 lg:h-16 lg:px-8"
        style={{ background: 'rgba(11, 12, 16, 0.92)', backdropFilter: 'blur(16px)' }}
      >
        {/* Mobile menu toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground lg:hidden"
          aria-label="Menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="S-M bosh sahifa">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 lg:size-9">
            <Play size={15} fill="currentColor" className="translate-x-0.5" />
          </div>
          <span className="font-display text-lg font-black tracking-tight text-foreground sm:text-xl">
            S<span className="text-primary">-</span>M
          </span>
        </Link>

        {/* Center Search Input (Desktop) */}
        <form onSubmit={submitSearch} className="mx-auto hidden w-full max-w-lg md:block">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 transition ${
              searchFocused ? 'border-primary bg-surface-2 shadow-lg shadow-primary/10' : 'border-border bg-surface'
            }`}
          >
            <Search size={15} className="shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Film, serial yoki janr qidiring..."
              className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground" aria-label="Tozalash">
                <X size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={toggleVoice}
              aria-label="Ovozli yordamchi"
              className={`rounded-lg p-1 transition ${
                voiceEnabled ? 'animate-pulse text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Mic size={15} />
            </button>
          </div>
        </form>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/25 sm:flex"
            >
              <LayoutDashboard size={14} /> Admin
            </Link>
          )}

          <button className="rounded-xl p-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground" aria-label="Bildirishnomalar">
            <Bell size={18} />
          </button>

          {isAuthenticated ? (
            <Link
              href="/profile"
              className="flex size-8 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground shadow-md"
              aria-label="Profil"
            >
              {userInitials}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary-hover active:scale-95 sm:px-4"
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
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-[min(18rem,calc(100vw-2rem))] border-r border-border bg-background p-4 transition-transform duration-200 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-64px)] lg:w-60 lg:translate-x-0 lg:pt-6`}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="font-display font-bold text-foreground">Menyu</span>
            <button onClick={closeSidebar} className="text-muted-foreground" aria-label="Yopish"><X size={18} /></button>
          </div>

          <form onSubmit={submitSearch} className="mb-4 lg:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
              <Search size={14} className="text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Qidirish..."
                className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </form>

          <nav className="space-y-5">
            <div>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Asosiy</p>
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
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Kutubxona</p>
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
            style={{ background: 'rgba(242,165,26,0.08)', border: '1px solid rgba(242,165,26,0.2)' }}
          >
            <Sparkles size={18} className="mb-2 text-primary" />
            <p className="text-xs font-bold text-foreground">Ovozli boshqaruv</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Kino va seriallarni ovoz bilan toping hamda boshqaring.
            </p>
            <button
              onClick={toggleVoice}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary transition hover:text-accent"
            >
              <Mic size={13} />
              {voiceEnabled ? 'Ovoz faol' : 'Ishga tushirish'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border/80 lg:hidden"
        style={{ background: 'rgba(11, 12, 16, 0.97)', backdropFilter: 'blur(20px)' }}
      >
        <Link href="/" className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 ${isActive('/') && !isActive('/movies') && !isActive('/series') ? 'text-primary' : 'text-muted-foreground'}`}>
          <HomeIcon size={19} />
          <span className="text-[10px] font-semibold">Bosh</span>
        </Link>
        <Link href="/movies" className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 ${isActive('/movies') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Film size={19} />
          <span className="text-[10px] font-semibold">Filmlar</span>
        </Link>
        <div className="flex flex-1 flex-col items-center">
          <button
            onClick={toggleVoice}
            className={`flex size-11 items-center justify-center rounded-full transition ${voiceEnabled ? 'animate-pulse bg-primary text-primary-foreground' : 'border border-border bg-surface text-primary'}`}
            aria-label="Ovoz"
          >
            <Mic size={19} />
          </button>
        </div>
        <Link href={isAuthenticated ? '/favorites' : '/login'} className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 ${isActive('/favorites') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Heart size={19} />
          <span className="text-[10px] font-semibold">Sevimli</span>
        </Link>
        <Link href={isAuthenticated ? '/profile' : '/login'} className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>
          <User size={19} />
          <span className="text-[10px] font-semibold">Profil</span>
        </Link>
      </nav>
    </div>
  )
}
