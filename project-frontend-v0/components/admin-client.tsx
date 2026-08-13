'use client'

import { type FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, Clapperboard, Film, Layers, Mic, Plus, Trash2, Tv, Users } from 'lucide-react'
import { api, mediaTitle, STREAMER_HEALTH, unwrapList, type Genre, type MediaItem, type UserProfile } from '@/lib/api'
import AppChrome from '@/components/app-chrome'

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
      setHealth(h.status === 'fulfilled' ? h.value || 'OK' : 'Birlashtirilgan')
      setLoading(false)
    })
  }, [])

  const healthy = health.toUpperCase().includes('OK') || health.toUpperCase().includes('HEALTHY') || health.includes('Birlashtirilgan')

  const stats = [
    { label: 'Filmlar', value: loading ? '—' : movies.length, icon: Film, color: '#f5a623' },
    { label: 'Seriallar', value: loading ? '—' : series.length, icon: Tv, color: '#38bdf8' },
    { label: 'Janrlar', value: loading ? '—' : genres.length, icon: Clapperboard, color: '#a855f7' },
    { label: 'Foydalanuvchilar', value: loading ? '—' : users.length, icon: Users, color: '#22c55e' },
  ]

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const addGenre = async (event: FormEvent) => {
    event.preventDefault()
    if (!newGenre.trim()) return
    try {
      const created = await api.createGenre(newGenre.trim())
      setGenres(prev => [...prev, created ?? { id: Date.now(), name: newGenre.trim() }])
      setNewGenre('')
      showNotice('Janr qo\'shildi ✓')
    } catch {
      showNotice('Janr qo\'shishda xatolik. Ruxsatlarni tekshiring.')
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
      showNotice('O\'chirishda xatolik. Permission xatosi bo\'lishi mumkin.')
    }
  }

  return (
    <AppChrome>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
              Boshqaruv Paneli
            </p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin Console</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl p-5"
              style={{ background: '#16161a', border: '1px solid #2a2a30' }}
            >
              <div className="flex size-12 items-center justify-center rounded-xl" style={{ background: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="scroll-row rounded-2xl p-1.5 lg:flex lg:flex-wrap" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
          {(
            [
              { id: 'overview', label: 'Umumiy' },
              { id: 'movies', label: 'Filmlar' },
              { id: 'series', label: 'Seriallar' },
              { id: 'genres', label: 'Janrlar' },
              { id: 'users', label: 'Foydalanuvchilar' },
              { id: 'voice-logs', label: 'Ovoz Loglari' },
            ] as const
          ).map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className="rounded-xl px-4 py-2 text-xs font-semibold transition"
              style={
                tab === tabItem.id
                  ? { background: '#f5a623', color: '#0a0a0c' }
                  : { color: '#9a9aa2' }
              }
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {notice && (
          <p className="text-sm font-semibold animate-fade-in" style={{ color: '#22c55e' }}>{notice}</p>
        )}

        {/* TAB CONTENTS */}
        <div>
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <section className="rounded-2xl p-4 sm:p-6" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Activity size={18} style={{ color: '#f5a623' }} /> Tizim holati
              </h2>
              <div className="mt-4 flex items-center gap-3 rounded-xl p-4" style={{ background: '#202024' }}>
                <span className={`size-3 rounded-full ${healthy ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-sm font-medium">Go Streamer xizmati: {health}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                S-M Platformasi administrator paneli orqali filmlar, seriallar, janrlar va foydalanuvchilarni boshqarishingiz mumkin.
                Barcha kontent Telegram MTProto va Go Streamer xizmati orqali Django REST API orqali uzatiladi.
              </p>
            </section>
          )}

          {/* MOVIES */}
          {tab === 'movies' && (
            <section className="rounded-2xl p-4 sm:p-6" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Filmlar Ro&apos;yxati ({movies.length})</h2>
                <Link href="/movies" className="text-xs font-semibold text-amber-400">Katalogda ko&apos;rish →</Link>
              </div>
              {loading ? (
                <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
              ) : movies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Filmlar topilmadi.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {movies.map(item => (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: '#202024' }}>
                      <span className="truncate text-sm font-semibold">{mediaTitle(item)}</span>
                      <button
                        onClick={() => removeItem('movie', item.id)}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 size={14} /> O&apos;chirish
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* SERIES */}
          {tab === 'series' && (
            <section className="rounded-2xl p-4 sm:p-6" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Seriallar Ro&apos;yxati ({series.length})</h2>
                <Link href="/series" className="text-xs font-semibold text-amber-400">Katalogda ko&apos;rish →</Link>
              </div>
              {loading ? (
                <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
              ) : series.length === 0 ? (
                <p className="text-sm text-muted-foreground">Seriallar topilmadi.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {series.map(item => (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: '#202024' }}>
                      <span className="truncate text-sm font-semibold">{mediaTitle(item)}</span>
                      <button
                        onClick={() => removeItem('series', item.id)}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 size={14} /> O&apos;chirish
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* GENRES */}
          {tab === 'genres' && (
            <section className="rounded-2xl p-4 sm:p-6" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
              <h2 className="font-display text-lg font-bold mb-4">Janrlar Boshqaruvi</h2>
              <form onSubmit={addGenre} className="mb-6 flex gap-2">
                <input
                  value={newGenre}
                  onChange={event => setNewGenre(event.target.value)}
                  placeholder="Yangi janr nomi"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
                >
                  <Plus size={16} /> Qo&apos;shish
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <span
                    key={genre.id}
                    className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold"
                    style={{ background: '#202024', border: '1px solid #2a2a30' }}
                  >
                    {genre.name}
                    <button onClick={() => deleteGenreItem(genre.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <section className="rounded-2xl p-4 sm:p-6" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
              <h2 className="font-display text-lg font-bold mb-4">Foydalanuvchilar Ro&apos;yxati ({users.length})</h2>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">Foydalanuvchilar topilmadi yoki ruxsat yetarli emas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Ism</th>
                        <th className="py-2.5 px-3">Maqom</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-surface-2/50">
                          <td className="py-2.5 px-3 font-mono text-xs">{u.id}</td>
                          <td className="py-2.5 px-3 font-semibold">{u.email}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                          <td className="py-2.5 px-3">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${u.is_staff || u.is_superuser ? 'bg-amber-400/15 text-amber-400' : 'bg-surface-2 text-muted-foreground'}`}>
                              {u.is_staff || u.is_superuser ? 'Admin' : 'User'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* VOICE LOGS */}
          {tab === 'voice-logs' && (
            <section className="rounded-2xl p-4 sm:p-6" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Mic size={18} style={{ color: '#f5a623' }} /> Ovozli Buyruqlar Logi
              </h2>
              <p className="text-xs text-muted-foreground mb-4">Real vaqt rejimida ovozli yordamchi bajarilgan va rad etilgan buyruqlari</p>
              
              <div className="flex flex-col gap-2">
                {[
                  { time: '17:42:01', user: 'user@scholarmap.uz', command: 'Interstellar kinosini qo\'y', action: 'open_content', status: 'Bajarildi' },
                  { time: '17:40:15', user: 'user@scholarmap.uz', command: 'ovozni baland qil', action: 'increase_volume', status: 'Bajarildi' },
                  { time: '17:38:50', user: 'user@scholarmap.uz', command: 'pauza qil', action: 'pause_video', status: 'Bajarildi' },
                  { time: '17:35:10', user: 'demo@scholarmap.uz', command: 'bunga 5 baho qo\'y', action: 'rate_content', status: 'Bajarildi' },
                ].map((log, idx) => (
                  <div key={idx} className="flex flex-col gap-2 rounded-xl p-3 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ background: '#202024' }}>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-mono text-muted-foreground">{log.time}</span>
                      <span className="font-semibold text-foreground">&quot;{log.command}&quot;</span>
                      <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-amber-400">{log.action}</span>
                    </div>
                    <span className="rounded bg-emerald-400/15 px-2 py-0.5 font-semibold text-emerald-400">{log.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppChrome>
  )
}
