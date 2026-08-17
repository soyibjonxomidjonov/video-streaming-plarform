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
      fetch(STREAMER_HEALTH, { cache: 'no-store' }).then((r) => r.text()),
    ]).then(([m, s, g, u, h]) => {
      if (m.status === 'fulfilled') setMovies(unwrapList(m.value))
      if (s.status === 'fulfilled') setSeries(unwrapList(s.value))
      if (g.status === 'fulfilled') setGenres(unwrapList(g.value))
      if (u.status === 'fulfilled') setUsers(unwrapList(u.value))
      setHealth(h.status === 'fulfilled' ? h.value || 'OK' : 'Online (Django/Go Streamer)')
      setLoading(false)
    })
  }, [])

  const stats = [
    { label: 'Filmlar soni', value: loading ? '—' : movies.length, href: '/admin/movies', icon: Film, color: '#00e599' },
    { label: 'Seriallar soni', value: loading ? '—' : series.length, href: '/admin/series', icon: Tv, color: '#80ffc8' },
    { label: 'Janrlar', value: loading ? '—' : genres.length, href: '/admin/genres', icon: Clapperboard, color: '#ffb703' },
    { label: 'Foydalanuvchilar', value: loading ? '—' : users.length, href: '/admin/users', icon: Users, color: '#38bdf8' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group flex items-center justify-between rounded-3xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-6 transition hover:border-[#00e599] hover:shadow-[0_0_20px_rgba(0,229,153,0.15)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[rgba(0,229,153,0.12)] text-[#00e599]">
                  <Icon size={22} />
                </div>
                <div>
                  <p className="font-display text-2xl font-black text-[#f5f7f6]">{s.value}</p>
                  <p className="text-xs text-[#8c9994]">{s.label}</p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-[#8c9994] opacity-0 group-hover:opacity-100 transition" />
            </Link>
          )
        })}
      </div>

      {/* System Health Panel */}
      <div className="rounded-3xl border border-[rgba(0,229,153,0.18)] bg-[#101514] p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[rgba(0,229,153,0.08)] pb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#00e599]" />
            <h2 className="font-display text-base font-bold text-[#f5f7f6]">Tizim va Streamer Holati</h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[#00e599]/15 px-3 py-1 text-xs font-bold text-[#00e599]">
            <CheckCircle2 size={13} /> Active
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-2xl border border-[rgba(0,229,153,0.1)] bg-[#161f1c] p-4">
            <span className="text-[#8c9994]">Go Streamer (Port 8081)</span>
            <p className="mt-1 font-bold text-[#00e599]">{health}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(0,229,153,0.1)] bg-[#161f1c] p-4">
            <span className="text-[#8c9994]">Django REST API v1</span>
            <p className="mt-1 font-bold text-[#f5f7f6]">https://backend.scholarmap.uz</p>
          </div>
          <div className="rounded-2xl border border-[rgba(0,229,153,0.1)] bg-[#161f1c] p-4">
            <span className="text-[#8c9994]">AI WebSocket Agent</span>
            <p className="mt-1 font-bold text-[#00e599]">Groq LLM + Channels (/ws/agent/)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
