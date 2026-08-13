'use client'

import { type FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { Film, Layers, Plus, Trash2, Users } from 'lucide-react'
import { api, mediaTitle, STREAMER_HEALTH, unwrapList, type Genre, type MediaItem } from '@/lib/api'

type Tab = 'overview' | 'movies' | 'series' | 'genres'

export default function AdminClient() {
  const [tab, setTab] = useState<Tab>('overview')
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [series, setSeries] = useState<MediaItem[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [health, setHealth] = useState('Checking...')
  const [loading, setLoading] = useState(true)
  const [newGenre, setNewGenre] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    Promise.allSettled([
      api.movies(),
      api.series(),
      api.genres(),
      fetch(STREAMER_HEALTH, { cache: 'no-store' }).then(r => r.text()),
    ]).then(([m, s, g, h]) => {
      if (m.status === 'fulfilled') setMovies(unwrapList(m.value))
      if (s.status === 'fulfilled') setSeries(unwrapList(s.value))
      if (g.status === 'fulfilled') setGenres(unwrapList(g.value))
      setHealth(h.status === 'fulfilled' ? h.value || 'OK' : 'Unavailable')
      setLoading(false)
    })
  }, [])

  const healthy = health.toUpperCase().includes('OK') || health.toUpperCase().includes('HEALTHY')

  const stats = [
    { label: 'Movies', value: loading ? '—' : movies.length, icon: Film },
    { label: 'Series', value: loading ? '—' : series.length, icon: Layers },
    { label: 'Genres', value: loading ? '—' : genres.length, icon: Users },
    { label: 'Streamer', value: loading ? '—' : healthy ? 'Healthy' : 'Down', icon: Users },
  ]

  const addGenre = async (event: FormEvent) => {
    event.preventDefault()
    if (!newGenre.trim()) return
    try {
      const created = await api.createGenre(newGenre.trim())
      setGenres(prev => [...prev, created ?? { id: Date.now(), name: newGenre.trim() }])
      setNewGenre('')
      setNotice('Genre added.')
    } catch {
      setNotice('Could not add genre. Check your permissions.')
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
      setNotice('Item removed.')
    } catch {
      setNotice('Could not delete. Check your permissions.')
    }
  }

  const list = tab === 'series' ? series : movies

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Operations</p>
            <h1 className="mt-2 font-display text-4xl font-bold">Admin console</h1>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back home
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <stat.icon className="text-primary" size={22} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {(['overview', 'movies', 'series', 'genres'] as Tab[]).map(item => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${tab === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {item}
            </button>
          ))}
        </div>

        {notice && <p className="mt-4 text-sm text-primary">{notice}</p>}

        <div className="mt-6">
          {tab === 'overview' && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold">System health</h2>
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-secondary p-4">
                <span className={`size-2.5 rounded-full ${healthy ? 'bg-primary' : 'bg-accent'}`} />
                <span className="truncate text-sm">Go streamer: {health}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Manage movies, series, episodes and genres. Content is streamed from Telegram through the Go streamer service and
                served via the Django API.
              </p>
            </section>
          )}

          {(tab === 'movies' || tab === 'series') && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold capitalize">{tab}</h2>
              {loading ? (
                <div className="mt-4 flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-14 animate-pulse rounded-xl bg-secondary" />
                  ))}
                </div>
              ) : list.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No {tab} found.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-2">
                  {list.map(item => (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
                      <span className="truncate text-sm font-medium">{mediaTitle(item)}</span>
                      <button
                        onClick={() => removeItem(tab === 'series' ? 'series' : 'movie', item.id)}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/10"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === 'genres' && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold">Genres</h2>
              <form onSubmit={addGenre} className="mt-4 flex gap-2">
                <input
                  value={newGenre}
                  onChange={event => setNewGenre(event.target.value)}
                  placeholder="New genre name"
                  className="min-h-11 flex-1 rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
                  <Plus size={16} /> Add
                </button>
              </form>
              <div className="mt-5 flex flex-wrap gap-2">
                {genres.map(genre => (
                  <span key={genre.id} className="rounded-lg bg-secondary px-3 py-1.5 text-sm">
                    {genre.name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
