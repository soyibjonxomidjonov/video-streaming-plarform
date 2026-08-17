'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LayoutDashboard, Film, Tv, Clapperboard, Users, Mic, ShieldAlert, ArrowLeft, Layers } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

const ADMIN_LINKS = [
  { label: 'Statistika', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Filmlar', href: '/admin/movies', icon: Film },
  { label: 'Seriallar', href: '/admin/series', icon: Tv },
  { label: 'Epizodlar', href: '/admin/episodes', icon: Layers },
  { label: 'Janrlar', href: '/admin/genres', icon: Clapperboard },
  { label: 'Foydalanuvchilar', href: '/admin/users', icon: Users },
  { label: 'Ovoz Loglari', href: '/admin/voice-logs', icon: Mic },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, user, isAdmin, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/')
    }
  }, [loading, isAdmin, router])

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  // Prevent rendering admin UI if not admin
  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070A0C]">
        <div className="size-8 rounded-full border-2 border-[#00FFA3] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Admin Top Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(0,255,163,0.12)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg border border-[rgba(0,255,163,0.3)] bg-[rgba(0,255,163,0.15)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#00FFA3]">
              <ShieldAlert size={12} aria-hidden="true" /> Boshqaruv
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-black text-[#F8FAFC] sm:text-3xl">
            Admin Console
          </h1>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] px-5 py-2.5 text-xs font-bold text-[#64748B] transition-all hover:border-[#00FFA3] hover:text-[#00FFA3] hover:bg-[rgba(0,255,163,0.05)] focus-visible:outline-2 focus-visible:outline-[#00FFA3]"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Asosiy saytga qaytish
        </Link>
      </div>

      {/* Admin Subnav Tabs */}
      <div className="scroll-row mb-8 flex gap-2 rounded-2xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-1.5 overflow-x-auto shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        {ADMIN_LINKS.map((item) => {
          const active = isActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-[#00FFA3] ${
                active
                  ? 'bg-[#00FFA3] text-[#070A0C] shadow-[0_0_15px_rgba(0,255,163,0.3)]'
                  : 'text-[#64748B] hover:bg-[#0B1013] hover:text-[#F8FAFC]'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Admin Content View */}
      <div>
        {children}
      </div>
    </div>
  )
}
