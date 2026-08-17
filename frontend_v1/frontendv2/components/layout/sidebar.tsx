// @ts-nocheck
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
// @ts-ignore
import {
  Home, Film, Tv, Bookmark, Search, User, Settings, ShieldAlert, Calendar, TrendingUp
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Logo } from '@/components/ui/logo'
import { API_BASE, getImageUrl } from '@/lib/api'

type NavItem = {
  icon: LucideIcon
  label: string
  href: string
  exact?: boolean
  requiresAuth?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home,     label: 'Asosiy',    href: '/',           exact: true },
  { icon: Film,     label: 'Filmlar',   href: '/movies' },
  { icon: Tv,       label: 'Seriallar', href: '/series' },
  { icon: TrendingUp, label: 'Kashfiyot', href: '/explore' },
  { icon: Search,   label: 'Qidiruv',   href: '/search' },
  { icon: Bookmark, label: 'Sevimli',   href: '/favorites',  requiresAuth: true },
  { icon: Calendar, label: 'Tarix',     href: '/history',    requiresAuth: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAdmin, isAuthenticated, user } = useAuth()

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const userInitials = (user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ''}`
    : user?.email?.slice(0, 2) ?? 'SM'
  ).toUpperCase()

  // Only show auth-required items when authenticated
  const visibleItems = NAV_ITEMS.filter(item => !item.requiresAuth || isAuthenticated)

  return (
    <>
      {/* ═══════════════════════════════════════════════
          DESKTOP SIDEBAR — lg+ only, sticky flex sibling
          ═══════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex w-[5.5rem] shrink-0 h-screen sticky top-0 z-40 flex-col items-center justify-between border-r border-[rgba(0,255,163,0.12)] py-6"
        style={{
          background: 'rgba(7, 10, 12, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        aria-label="Asosiy navigatsiya"
        role="navigation"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-1.5">
          <Link
            href="/"
            prefetch={true}
            aria-label="StreamVibe — Bosh sahifaga qaytish"
            className="rounded-2xl focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2 transition-transform hover:scale-105"
          >
            <Logo className="size-11" />
          </Link>
          <div className="flex flex-col items-center leading-none select-none">
            <span className="text-[8px] font-black tracking-[0.15em] text-[#00FFA3] uppercase">SM</span>
            <span className="text-[7px] font-semibold tracking-[0.12em] text-[#4B5563] uppercase">STREAM</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col items-center gap-1.5" aria-label="Sahifalar">
          {visibleItems.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex h-[3.75rem] w-[3.75rem] flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2 ${
                  active
                    ? 'bg-[rgba(0,255,163,0.14)] text-[#00FFA3] border border-[rgba(0,255,163,0.35)] shadow-[0_0_18px_rgba(0,255,163,0.2)]'
                    : 'text-[#6B7280] hover:bg-[#141F24] hover:text-[#F8FAFC]'
                }`}
                title={item.label}
              >
                {/* Active indicator bar */}
                {active && (
                  <span
                    className="absolute -left-[11px] top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#00FFA3] shadow-[0_0_10px_#00FFA3]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  size={21}
                  className={`transition-transform duration-200 group-hover:scale-110 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
                  aria-hidden="true"
                />
                <span className="text-[9px] font-semibold leading-none tracking-tight">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom: Admin, Settings, Profile */}
        <div className="flex flex-col items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              prefetch={true}
              aria-label="Admin panelga o'tish"
              aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
              title="Admin Panel"
              className={`group flex size-11 items-center justify-center rounded-2xl transition focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2 ${
                pathname.startsWith('/admin')
                  ? 'bg-[rgba(0,255,163,0.14)] text-[#00FFA3]'
                  : 'text-[#4B5563] hover:bg-[#141F24] hover:text-[#00FFA3]'
              }`}
            >
              <ShieldAlert size={19} aria-hidden="true" />
            </Link>
          )}

          <Link
            href="/settings"
            prefetch={true}
            aria-label="Sozlamalar"
            aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
            title="Sozlamalar"
            className={`group flex size-11 items-center justify-center rounded-2xl transition focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2 ${
              pathname.startsWith('/settings')
                ? 'bg-[rgba(0,255,163,0.12)] text-[#00FFA3]'
                : 'text-[#4B5563] hover:bg-[#141F24] hover:text-[#F8FAFC]'
            }`}
          >
            <Settings size={19} aria-hidden="true" />
          </Link>

          {isAuthenticated ? (
            <Link
              href="/profile"
              prefetch={true}
              aria-label={`Profil — ${user?.first_name ?? user?.email ?? 'Foydalanuvchi'}`}
              title="Mening profilim"
              className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0D4D38] to-[#00FFA3] font-display text-xs font-extrabold text-[#070A0C] shadow-[0_0_12px_rgba(0,255,163,0.28)] transition hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFA3]"
            >
              {user?.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={getImageUrl(user.picture)} 
                  alt="Profil" 
                  className="size-full object-cover" 
                />
              ) : (
                userInitials
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              prefetch={true}
              aria-label="Kirish"
              title="Kirish"
              className="flex size-11 items-center justify-center rounded-xl bg-[#00FFA3] text-xs font-extrabold text-[#070A0C] shadow-[0_0_12px_rgba(0,255,163,0.28)] transition hover:bg-[#1AFFA8] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFA3]"
            >
              <User size={17} aria-hidden="true" />
            </Link>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          MOBILE BOTTOM NAV — < lg, fixed at bottom
          ═══════════════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex h-[4.25rem] items-center justify-around border-t border-[rgba(0,255,163,0.1)] px-1 pb-[env(safe-area-inset-bottom)]"
        style={{
          background: 'rgba(7, 10, 12, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        aria-label="Mobil navigatsiya"
      >
        {/* Show 5 primary nav items on mobile */}
        {NAV_ITEMS.slice(0, 5).filter(item => !item.requiresAuth || isAuthenticated).map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[3rem] min-h-[3rem] px-1 py-1 transition focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:rounded-xl ${
                active ? 'text-[#00FFA3]' : 'text-[#6B7280]'
              }`}
            >
              <div
                className={`relative flex size-8 items-center justify-center rounded-xl transition ${
                  active ? 'bg-[rgba(0,255,163,0.14)]' : ''
                }`}
              >
                <Icon size={20} className={active ? 'stroke-[2.5]' : 'stroke-[1.8]'} aria-hidden="true" />
                {active && (
                  <span
                    className="absolute -top-0.5 right-0.5 size-1.5 rounded-full bg-[#00FFA3] shadow-[0_0_6px_#00FFA3]"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export default Sidebar
