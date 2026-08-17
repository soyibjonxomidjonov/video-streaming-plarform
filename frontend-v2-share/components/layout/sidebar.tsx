'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Film, Tv, Bookmark, Search, User, Settings, ShieldAlert, Mic
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'
import { Logo } from '@/components/ui/logo'

type NavItem = {
  icon: LucideIcon
  label: string
  href: string
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Asosiy', href: '/', exact: true },
  { icon: Film, label: 'Filmlar', href: '/movies' },
  { icon: Tv, label: 'Seriallar', href: '/series' },
  { icon: Bookmark, label: 'Sevimlilar', href: '/favorites' },
  { icon: Search, label: 'Qidiruv', href: '/search' },
  { icon: User, label: 'Profil', href: '/profile' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAdmin, isAuthenticated, user } = useAuth()
  const { enabled: voiceEnabled, toggle: toggleVoice } = useVoiceAssistant()

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const userInitials = (user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ''}`
    : user?.email?.slice(0, 2) ?? 'SM'
  ).toUpperCase()

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          DESKTOP SIDEBAR — sticky flex sibling, NEVER overlaps
          ═══════════════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex w-24 shrink-0 h-screen sticky top-0 z-40 flex-col items-center justify-between border-r border-[rgba(0,255,163,0.15)] bg-[#070A0C]/95 py-6 backdrop-blur-xl"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-1.5">
          <Link href="/" prefetch={true} aria-label="S-M Stream Bosh sahifa">
            <Logo className="size-12" />
          </Link>
          <span className="text-[9px] font-black tracking-[0.2em] text-[#00FFA3] uppercase">
            STREAM
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`group relative flex h-16 w-16 flex-col items-center justify-center gap-1.5 rounded-2xl transition-all duration-200 ${
                  active
                    ? 'bg-[rgba(0,255,163,0.15)] text-[#00FFA3] border border-[rgba(0,255,163,0.4)] shadow-[0_0_20px_rgba(0,255,163,0.25)]'
                    : 'text-[#94A3B8] hover:bg-[#141F24] hover:text-[#F8FAFC]'
                }`}
                title={item.label}
              >
                {/* Active left indicator */}
                {active && (
                  <span className="absolute -left-[12px] top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#00FFA3] shadow-[0_0_12px_#00FFA3]" />
                )}
                <Icon size={22} className={`transition-transform group-hover:scale-110 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] font-semibold leading-none tracking-tight">
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* Voice Assistant */}
          <button
            onClick={toggleVoice}
            className={`group relative mt-2 flex h-16 w-16 flex-col items-center justify-center gap-1.5 rounded-2xl transition-all duration-200 ${
              voiceEnabled
                ? 'bg-[rgba(0,255,163,0.2)] text-[#00FFA3] shadow-[0_0_18px_rgba(0,255,163,0.35)] border border-[#00FFA3]/50'
                : 'text-[#64748B] hover:bg-[#141F24] hover:text-[#00FFA3]'
            }`}
            title="AI Ovozli Yordamchi"
          >
            <Mic size={20} className={voiceEnabled ? 'animate-pulse text-[#00FFA3]' : ''} />
            <span className="text-[10px] font-bold text-[#00FFA3]">AI</span>
          </button>
        </nav>

        {/* Bottom: Admin, Settings, Profile */}
        <div className="flex flex-col items-center gap-2.5">
          {isAdmin && (
            <Link
              href="/admin"
              prefetch={true}
              className={`group flex size-12 items-center justify-center rounded-2xl transition ${
                pathname.startsWith('/admin')
                  ? 'bg-[rgba(0,255,163,0.15)] text-[#00FFA3]'
                  : 'text-[#64748B] hover:bg-[#141F24] hover:text-[#00FFA3]'
              }`}
              title="Admin Panel"
            >
              <ShieldAlert size={20} />
            </Link>
          )}

          <Link
            href="/settings"
            prefetch={true}
            className={`group flex size-12 items-center justify-center rounded-2xl transition ${
              pathname.startsWith('/settings')
                ? 'bg-[rgba(0,255,163,0.12)] text-[#00FFA3]'
                : 'text-[#64748B] hover:bg-[#141F24] hover:text-[#F8FAFC]'
            }`}
            title="Sozlamalar"
          >
            <Settings size={20} />
          </Link>

          {isAuthenticated ? (
            <Link
              href="/profile"
              prefetch={true}
              className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0D4D38] to-[#00FFA3] font-display text-sm font-extrabold text-[#070A0C] shadow-[0_0_14px_rgba(0,255,163,0.3)] transition hover:scale-105"
              title="Mening profilim"
            >
              {userInitials}
            </Link>
          ) : (
            <Link
              href="/login"
              prefetch={true}
              className="flex size-12 items-center justify-center rounded-2xl bg-[#00FFA3] text-sm font-extrabold text-[#070A0C] shadow-[0_0_14px_rgba(0,255,163,0.3)] transition hover:bg-[#1AFFA8]"
              title="Kirish"
            >
              <User size={18} />
            </Link>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MOBILE BOTTOM NAV (< 1024px)
          ═══════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[4.5rem] items-center justify-around border-t border-[rgba(0,255,163,0.12)] bg-[#070A0C]/95 px-2 backdrop-blur-xl lg:hidden pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] px-2 py-1 transition ${
                active ? 'text-[#00FFA3]' : 'text-[#64748B]'
              }`}
            >
              <div className={`relative flex size-9 items-center justify-center rounded-xl ${active ? 'bg-[rgba(0,255,163,0.14)]' : ''}`}>
                <Icon size={22} className={active ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                {active && (
                  <span className="absolute -top-0.5 size-1.5 rounded-full bg-[#00FFA3] shadow-[0_0_6px_#00FFA3]" />
                )}
              </div>
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </Link>
          )
        })}

        {/* Voice button */}
        <button
          onClick={toggleVoice}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] px-2 py-1 ${
            voiceEnabled ? 'text-[#00FFA3]' : 'text-[#64748B]'
          }`}
        >
          <div className={`flex size-9 items-center justify-center rounded-xl ${voiceEnabled ? 'bg-[rgba(0,255,163,0.2)] animate-pulse' : ''}`}>
            <Mic size={22} />
          </div>
          <span className="text-[10px] font-bold text-[#00FFA3] leading-none">Voice</span>
        </button>
      </nav>
    </>
  )
}
