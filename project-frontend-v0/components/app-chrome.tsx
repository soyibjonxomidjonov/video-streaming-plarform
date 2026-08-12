'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Clock3, Compass, Heart, Home as HomeIcon, Menu, Mic, Play, Search, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'

function NavLink({ icon: Icon, label, href, active }: { icon: LucideIcon; label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  )
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()
  const { enabled: voiceEnabled, toggle: toggleVoice } = useVoiceAssistant()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    router.push(`/explore?q=${encodeURIComponent(query.trim())}`)
  }

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <header className="safe-top sticky top-0 z-30 flex min-h-[64px] items-center gap-2 border-b border-border/70 bg-background/90 px-3 py-2 backdrop-blur-xl sm:gap-4 sm:px-5 lg:h-[72px] lg:px-8">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={21} />
        </button>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Play size={17} fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            streamora<span className="text-primary">.</span>
          </span>
        </Link>
        <form onSubmit={submitSearch} className="mx-auto hidden w-full max-w-xl md:block">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
            <Search size={17} className="text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search movies, series, people..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={voiceEnabled ? "Ovozli yordamchini o'chirish" : 'Ovozli yordamchini yoqish'}
              className={`rounded-lg p-1.5 transition hover:bg-secondary ${voiceEnabled ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              <Mic size={16} />
            </button>
          </div>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <button className="rounded-xl p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Notifications">
            <Bell size={18} />
          </button>
          {isAuthenticated ? (
            <Link href="/profile" className="ml-1 flex size-9 items-center justify-center rounded-full bg-accent/25 text-sm font-semibold text-accent" aria-label="Profile">
              {(user?.username ?? user?.email ?? 'U').slice(0, 2).toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className="ml-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="flex">
        {sidebarOpen && <div className="fixed inset-0 z-10 bg-background/60 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}
        <aside
          className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-20 w-60 border-r border-border bg-background p-4 pt-20 lg:sticky lg:top-[72px] lg:block lg:h-[calc(100vh-72px)] lg:pt-4`}
        >
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">Menu</p>
          <nav className="flex flex-col gap-1">
            <NavLink icon={HomeIcon} label="Home" href="/" active={isActive('/')} />
            <NavLink icon={Compass} label="Explore" href="/explore" active={isActive('/explore')} />
            <NavLink icon={Search} label="Search" href="/explore" active={false} />
          </nav>
          <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">Your library</p>
          <nav className="flex flex-col gap-1">
            <NavLink icon={Heart} label="Favorites" href="/profile" active={false} />
            <NavLink icon={Clock3} label="Watch history" href="/profile" active={isActive('/profile')} />
          </nav>
          <div className="mt-8 hidden rounded-2xl bg-secondary p-4 lg:block">
            <Sparkles size={19} className="mb-3 text-primary" />
            <p className="text-sm font-semibold">Find your next favorite</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Tell us what you feel like watching.</p>
            <button onClick={toggleVoice} className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
              {voiceEnabled ? 'Voice assistant is on' : 'Try voice control'}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-3 pb-8 pt-4 sm:px-5 sm:pt-6 lg:px-8 lg:pb-16">{children}</main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
        <Link href="/" className={`rounded-xl p-2.5 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`} aria-label="Home">
          <HomeIcon size={20} />
        </Link>
        <Link href="/explore" className={`rounded-xl p-2.5 ${isActive('/explore') ? 'text-primary' : 'text-muted-foreground'}`} aria-label="Explore">
          <Compass size={20} />
        </Link>
        <button
          onClick={toggleVoice}
          className={`flex size-12 -translate-y-4 items-center justify-center rounded-full border-4 border-background shadow-lg transition ${voiceEnabled ? 'bg-accent text-primary-foreground' : 'bg-primary text-primary-foreground'}`}
          aria-label={voiceEnabled ? "Ovozli yordamchini o'chirish" : 'Ovozli yordamchini yoqish'}
          aria-pressed={voiceEnabled}
        >
          <Mic size={20} />
        </button>
        <Link href="/profile" className={`rounded-xl p-2.5 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`} aria-label="Saved">
          <Heart size={20} />
        </Link>
        <Link href="/profile" className="rounded-xl p-2.5 text-muted-foreground" aria-label="History">
          <Clock3 size={20} />
        </Link>
      </nav>
    </div>
  )
}
