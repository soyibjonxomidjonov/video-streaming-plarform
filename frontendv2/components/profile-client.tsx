'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Pencil, Check, Upload, User, Loader2, LayoutDashboard } from 'lucide-react'
import { api, mediaImage, mediaTitle, unwrapList, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

export default function ProfileClient() {
  const { user, logout, refresh } = useAuth()
  const router = useRouter()
  
  const [favorites, setFavorites] = useState<MediaItem[]>([])
  const [historyCount, setHistoryCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [profileAvatar, setProfileAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
      setAge(user.age ? String(user.age) : '')
    }
    setProfileAvatar(localStorage.getItem('streamora_profile_avatar') || '')
  }, [user])

  useEffect(() => {
    let active = true
    Promise.allSettled([api.favorites(), api.history()]).then(async ([fav, hist]) => {
      if (!active) return

      let favMovies: MediaItem[] = []
      if (fav.status === 'fulfilled') {
        const rawFavs = unwrapList(fav.value) as any[]
        // Extract movie IDs from the favorites records
        const movieIds = rawFavs.map(r => r.movie).filter(Boolean)
        const fetchPromises = movieIds.map(id => api.movie(id).catch(() => null))
        const resolved = await Promise.all(fetchPromises)
        favMovies = resolved.filter(Boolean) as MediaItem[]
      }

      if (!active) return
      setFavorites(favMovies)
      
      if (hist.status === 'fulfilled') {
        const rawHist = unwrapList(hist.value) as any[]
        setHistoryCount(rawHist.length)
      }
      
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      if (user?.id) {
        await api.updateUser(user.id, {
          first_name: firstName,
          last_name: lastName,
          ...(age ? { age: Number(age) } : {}),
        })
        await refresh()
      }
      if (profileAvatar) {
        localStorage.setItem('streamora_profile_avatar', profileAvatar)
      }
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update profile', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setProfileAvatar(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || (user?.email ? user.email.split('@')[0] : 'Streamora member')
  const initials = displayName.slice(0, 2).toUpperCase() || 'U'

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

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-10 relative">
          
          {/* Edit Button */}
          <button 
            disabled={saving}
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            className="absolute top-6 right-6 flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-4 py-2 text-sm font-semibold hover:bg-primary/20 transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : isEditing ? <><Check size={16}/> Save</> : <><Pencil size={16}/> Edit Profile</>}
          </button>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center mt-4 sm:mt-0">
            {/* Avatar Section */}
            <div className="relative group">
              {profileAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileAvatar} alt="Avatar" className="size-24 rounded-full object-cover border-4 border-background" />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full bg-accent/20 text-3xl font-bold text-accent">
                  {initials}
                </div>
              )}
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition backdrop-blur-sm"
                >
                  <Upload size={24} />
                </button>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Info Section */}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[.18em] text-primary">Your profile</p>
              
              {isEditing ? (
                <div className="mt-2 flex flex-col gap-2 max-w-md">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="font-display text-lg font-semibold bg-secondary/50 border border-border rounded-xl px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="First name"
                    />
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="font-display text-lg font-semibold bg-secondary/50 border border-border rounded-xl px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Last name"
                    />
                  </div>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="text-sm bg-secondary/50 border border-border rounded-xl px-3 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Age"
                  />
                </div>
              ) : (
                <>
                  <h1 className="mt-2 font-display text-3xl font-bold">{displayName}</h1>
                  {user?.age && <p className="text-xs text-muted-foreground mt-0.5">{user.age} years old</p>}
                </>
              )}
              
              <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                 <User size={14}/> {user?.email || 'No email associated'}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary p-5 border border-transparent hover:border-border transition">
              <p className="text-3xl font-bold">{loading ? <Loader2 size={24} className="animate-spin text-muted-foreground"/> : favorites.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Favorites saved</p>
            </div>
            <div className="rounded-2xl bg-secondary p-5 border border-transparent hover:border-border transition">
              <p className="text-3xl font-bold">{loading ? <Loader2 size={24} className="animate-spin text-muted-foreground"/> : historyCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">Titles watched</p>
            </div>
            <div className="rounded-2xl bg-secondary p-5 border border-transparent hover:border-border transition flex flex-col justify-between">
              <div>
                <p className="text-3xl font-bold">{user?.is_staff || user?.is_superuser ? 'Admin' : 'Member'}</p>
                <p className="mt-1 text-sm text-muted-foreground">Account type</p>
              </div>
              {(user?.is_staff || user?.is_superuser) && (
                <Link
                  href="/admin"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 w-fit"
                >
                  <LayoutDashboard size={14} /> Open Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
             Your favorites
             {!loading && <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{favorites.length}</span>}
          </h2>
          {loading ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-[2/3] animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border py-16 text-center">
              <div className="size-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-2">
                 ⭐
              </div>
              <h3 className="font-semibold">No favorites yet</h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                Tap the save button on any title to add it here and watch it later.
              </p>
              <Link href="/explore" className="mt-2 rounded-xl bg-primary/10 text-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary/20 transition">
                Explore catalog
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {favorites.map(item => (
                <Link key={item.id} href={`/watch/movie/${item.id}`} className="group relative overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-[2/3] overflow-hidden bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaImage(item) || '/placeholder.svg'} alt={mediaTitle(item)} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                     <p className="truncate text-xs font-medium text-white shadow-sm">{mediaTitle(item)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
