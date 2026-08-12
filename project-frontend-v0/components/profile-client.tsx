'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { api, mediaImage, mediaTitle, unwrapList, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

export default function ProfileClient() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<MediaItem[]>([])
  const [historyCount, setHistoryCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.allSettled([api.favorites(), api.history()]).then(([fav, hist]) => {
      if (!active) return
      if (fav.status === 'fulfilled') setFavorites(unwrapList(fav.value))
      if (hist.status === 'fulfilled') setHistoryCount(unwrapList(hist.value).length)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const initials = (user?.username ?? user?.email ?? 'U').slice(0, 2).toUpperCase()

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back home
          </Link>
          <button
            onClick={() => {
              logout()
              router.replace('/')
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-accent/20 text-2xl font-bold text-accent">{initials}</div>
            <div>
              <p className="text-xs uppercase tracking-[.18em] text-primary">Your profile</p>
              <h1 className="mt-2 font-display text-3xl font-bold">{user?.username ?? 'Streamora member'}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary p-5">
              <p className="text-2xl font-bold">{loading ? '—' : favorites.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Favorites</p>
            </div>
            <div className="rounded-2xl bg-secondary p-5">
              <p className="text-2xl font-bold">{loading ? '—' : historyCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">Titles watched</p>
            </div>
            <div className="rounded-2xl bg-secondary p-5">
              <p className="text-2xl font-bold">{user?.is_staff || user?.is_superuser ? 'Admin' : 'Member'}</p>
              <p className="mt-1 text-sm text-muted-foreground">Account type</p>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Your favorites</h2>
          {loading ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-[2/3] animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              You have no favorites yet. Tap the save button on any title to add it here.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {favorites.map(item => (
                <Link key={item.id} href={`/watch/movie/${item.id}`} className="group overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-[2/3] overflow-hidden bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaImage(item) || '/placeholder.svg'} alt={mediaTitle(item)} className="size-full object-cover transition group-hover:scale-105" />
                  </div>
                  <p className="truncate p-2 text-xs font-medium">{mediaTitle(item)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
