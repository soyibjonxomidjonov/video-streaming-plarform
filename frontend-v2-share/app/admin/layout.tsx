'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const { isAuthenticated, user, isAdmin, loading } = useAuth()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Admin Top Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(0,229,153,0.12)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-lg border border-[rgba(0,229,153,0.3)] bg-[#00e599]/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#00e599]">
              <ShieldAlert size={12} /> Boshqaruv
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-black text-[#f5f7f6] sm:text-3xl">
            Admin Console
          </h1>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#101514] px-4 py-2 text-xs font-bold text-[#8c9994] transition hover:border-[#00e599] hover:text-[#00e599]"
        >
          <ArrowLeft size={14} /> Asosiy saytga qaytish
        </Link>
      </div>

      {/* Admin Subnav Tabs */}
      <div className="scroll-row mb-8 flex gap-2 rounded-2xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-1.5">
        {ADMIN_LINKS.map((item) => {
          const active = isActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
                active
                  ? 'bg-[#00e599] text-[#080a0a] shadow-[0_0_12px_rgba(0,229,153,0.3)]'
                  : 'text-[#8c9994] hover:bg-[#161f1c] hover:text-[#f5f7f6]'
              }`}
            >
              <Icon size={15} />
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
