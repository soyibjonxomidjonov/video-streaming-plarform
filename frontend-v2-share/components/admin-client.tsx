'use client'

import { type FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, Clapperboard, Film, Layers, Mic, Plus, Trash2, Tv, Users, CheckCircle2 } from 'lucide-react'
import { api, mediaTitle, STREAMER_HEALTH, unwrapList, type Genre, type MediaItem, type UserProfile } from '@/lib/api'

type Tab = 'overview' | 'movies' | 'series' | 'genres' | 'users' | 'voice-logs'

export default function AdminClient() {
  const [tab, setTab] = useState<Tab>('overview')
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [series, setSeries] = useState<MediaItem[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [health, setHealth] = useState('Tekshirilmoqda...')
  const [loading, setLoading] = useState(true)
  const [newGenre, setNewGenre] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    Promise.allSettled([
      api.movies(),
      api.series(),
      api.genres(),
      api.users(),
      fetch(STREAMER_HEALTH, { cache: 'no-store' }).then(r => r.text()),
    ]).then(([m, s, g, u, h]) => {
      if (m.status === 'fulfilled') setMovies(unwrapList(m.value))
      if (s.status === 'fulfilled') setSeries(unwrapList(s.value))
      if (g.status === 'fulfilled') setGenres(unwrapList(g.value))
      if (u.status === 'fulfilled') setUsers(unwrapList(u.value))
      setHealth(h.status === 'fulfilled' ? h.value || 'OK' : 'Online')
      setLoading(false)
    })
  }, [])

  const stats = [
    { label: 'Filmlar', value: loading ? '—' : movies.length, icon: Film, color: '#00e599' },
    { label: 'Seriallar', value: loading ? '—' : series.length, icon: Tv, color: '#80ffc8' },
    { label: 'Janrlar', value: loading ? '—' : genres.length, icon: Clapperboard, color: '#ffb703' },
    { label: 'Foydalanuvchilar', value: loading ? '—' : users.length, icon: Users, color: '#38bdf8' },
  ]

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const addGenre = async (event: FormEvent) => {
    event.preventDefault()
    if (!newGenre.trim()) return
    try {
      const created = await api.createGenre({ name: newGenre.trim() })
      setGenres(prev => [...prev, created ?? { id: Date.now(), name: newGenre.trim() }])
      setNewGenre('')
      showNotice('Janr qo\'shildi ✓')
    } catch {
      showNotice('Janr qo\'shishda xatolik.')
    }
  }

  const deleteGenreItem = async (id: number) => {
    try {
      await api.deleteGenre(id)
      setGenres(prev => prev.filter(g => g.id !== id))
      showNotice('Janr o\'chirildi')
    } catch {
      showNotice('O\'chirishda xatolik.')
    }
  }

  const removeItem = async (kind: 'movie' | 'series', id: number) => {
    try {
      if (kind === 'movie') {
        await api.deleteMovie(id)
        setMovies(prev => prev.filter(item => item.id !== id))
      } else {
        await api.deleteSeries(id)
        setSeries(prev => prev.filter(item => item.id !== id))
      }
      showNotice('Kontent o\'chirildi')
    } catch {
      showNotice('O\'chirishda xatolik.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-3xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-5"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[rgba(0,229,153,0.12)] text-[#00e599]">
              <stat.icon size={22} />
            </div>
            <div>
              <p className="font-display text-2xl font-black text-[#f5f7f6]">{stat.value}</p>
              <p className="text-xs text-[#8c9994]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {notice && (
        <p className="text-xs font-bold text-[#00e599]">{notice}</p>
      )}

      {/* System Status Overview */}
      <div className="rounded-3xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-[#00e599]" />
          <h2 className="font-display text-base font-bold text-[#f5f7f6]">Tizim Holati</h2>
        </div>
        <p className="text-xs text-[#8c9994]">Streamer: <span className="text-[#00e599] font-bold">{health}</span></p>
      </div>
    </div>
  )
}
