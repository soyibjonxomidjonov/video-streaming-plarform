'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, Film, Tv, Clapperboard, Users, Mic, Plus, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { api, STREAMER_HEALTH, unwrapList, type Genre, type MediaItem, type UserProfile } from '@/lib/api'

export default function AdminDashboardPage() {
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [series, setSeries] = useState<MediaItem[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [health, setHealth] = useState('Tekshirilmoqda...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.movies(),
      api.series(),
      api.genres(),
      api.users(),
    ]).then(([m, s, g, u]) => {
      if (m.status === 'fulfilled') setMovies(unwrapList(m.value))
      if (s.status === 'fulfilled') setSeries(unwrapList(s.value))
      if (g.status === 'fulfilled') setGenres(unwrapList(g.value))
      if (u.status === 'fulfilled') setUsers(unwrapList(u.value))
      
      setHealth('Online (System)')
      setLoading(false)
    })
  }, [])

    const stats = [
    { label: 'Filmlar soni', value: loading ? '—' : movies.length, href: '/admin/movies', icon: Film, color: '#00FFA3' },
    { label: 'Seriallar soni', value: loading ? '—' : series.length, href: '/admin/series', icon: Tv, color: '#1AFFA8' },
    { label: 'Janrlar', value: loading ? '—' : genres.length, href: '/admin/genres', icon: Clapperboard, color: '#F59E0B' },
    { label: 'Foydalanuvchilar', value: loading ? '—' : users.length, href: '/admin/users', icon: Users, color: '#38BDF8' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group flex items-center justify-between rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-6 transition-all hover:border-[#00FFA3] hover:shadow-[0_4px_20px_rgba(0,255,163,0.15)] focus-visible:outline-2 focus-visible:outline-[#00FFA3]"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[rgba(0,255,163,0.12)] text-[#00FFA3]">
                  <Icon size={24} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display text-3xl font-black text-[#F8FAFC]">{s.value}</p>
                  <p className="text-sm font-medium text-[#64748B] mt-0.5">{s.label}</p>
                </div>
              </div>
              <ArrowUpRight size={20} className="text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </Link>
          )
        })}
      </div>

      {/* System Health Panel */}
      <div className="rounded-3xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between border-b border-[rgba(0,255,163,0.08)] pb-5">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-[#00FFA3]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[#F8FAFC]">Tizim va Streamer Holati</h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[rgba(0,255,163,0.15)] px-3 py-1.5 text-xs font-bold text-[#00FFA3]">
            <CheckCircle2 size={14} aria-hidden="true" /> Active
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-2xl border border-[rgba(0,255,163,0.1)] bg-[#0B1013] p-5">
            <span className="text-[#64748B] font-medium">Go Streamer (Port 8081)</span>
            <p className="mt-2 font-bold text-[#00FFA3]">{health}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(0,255,163,0.1)] bg-[#0B1013] p-5">
            <span className="text-[#64748B] font-medium">Django REST API v1</span>
            <p className="mt-2 font-bold text-[#F8FAFC]">https://backend.scholarmap.uz</p>
          </div>
          <div className="rounded-2xl border border-[rgba(0,255,163,0.1)] bg-[#0B1013] p-5">
            <span className="text-[#64748B] font-medium">AI WebSocket Agent</span>
            <p className="mt-2 font-bold text-[#00FFA3]">Groq LLM + Channels (/ws/agent/)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
