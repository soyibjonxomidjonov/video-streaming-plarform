'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Pencil, Check, Upload, User, Loader2, LayoutDashboard, Heart, Clock } from 'lucide-react'
import { api, mediaImage, mediaTitle, unwrapList, type MediaItem, unwrapCount } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import AppChrome from '@/components/app-chrome'

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
  const [errorNotice, setErrorNotice] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
      setAge(user.age ? String(user.age) : '')
    }
    if (typeof window !== 'undefined') {
      setProfileAvatar(localStorage.getItem('streamora_profile_avatar') || '')
    }
  }, [user])

  useEffect(() => {
    let active = true
    async function loadUserData() {
      try {
        const [fav, hist] = await Promise.allSettled([api.movieFavorites(), api.movieProgress()])
        if (!active) return

        if (fav.status === 'fulfilled') {
          const rawFavs = unwrapList(fav.value) as any[]
          const favItems = rawFavs.map(r => r.movie ?? r).filter(Boolean) as MediaItem[]
          setFavorites(favItems)
        }

        if (hist.status === 'fulfilled') {
          setHistoryCount(unwrapCount(hist.value))
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadUserData()
    return () => { active = false }
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    setErrorNotice('')
    try {
      if (user?.id) {
        // PATCH method is used (Section 4.1.2 requirement)
        await api.updateUser(user.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          ...(age ? { age: Number(age) } : {}),
        })
        await refresh()
      }
      if (profileAvatar && typeof window !== 'undefined') {
        localStorage.setItem('streamora_profile_avatar', profileAvatar)
      }
      setIsEditing(false)
    } catch {
      setErrorNotice('Profilni saqlab bo\'lmadi. Permission xatosi bo\'lishi mumkin.')
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

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || (user?.email ? user.email.split('@')[0] : 'Foydalanuvchi')
  const initials = (displayName.slice(0, 2) || 'SM').toUpperCase()

  return (
    <AppChrome>
      <div className="flex flex-col gap-8">
        {/* Profile Card */}
        <div className="relative rounded-3xl p-6 sm:p-10" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
          {/* Edit button */}
          <button
            disabled={saving}
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            className="absolute right-3 top-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-50 sm:right-6 sm:top-6 sm:px-4 sm:text-sm"
            style={{ background: 'rgba(245,166,35,0.12)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.25)' }}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isEditing ? (
              <><Check size={16}/> Saqlash</>
            ) : (
              <><Pencil size={16}/> Tahrirlash</>
            )}
          </button>

          <div className="flex flex-col gap-5 pt-10 sm:flex-row sm:items-center sm:pt-0">
            {/* Avatar */}
            <div className="relative group shrink-0">
              {profileAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileAvatar} alt="Avatar" className="size-24 rounded-full object-cover border-4 border-background" />
              ) : (
                <div
                  className="flex size-24 items-center justify-center rounded-full text-3xl font-black text-black shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
                >
                  {initials}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition"
                >
                  <Upload size={22} />
                </button>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#f5a623' }}>Shaxsiy profil</p>

              {isEditing ? (
                <div className="mt-3 flex flex-col gap-3 max-w-md">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="text-sm font-semibold rounded-xl px-3 py-2 outline-none"
                      style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
                      placeholder="Ism"
                    />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="text-sm font-semibold rounded-xl px-3 py-2 outline-none"
                      style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
                      placeholder="Familiya"
                    />
                  </div>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="text-sm rounded-xl px-3 py-2 w-32 outline-none"
                    style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
                    placeholder="Yosh"
                  />
                  {errorNotice && <p className="text-xs text-red-400">{errorNotice}</p>}
                </div>
              ) : (
                <>
                  <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{displayName}</h1>
                  {user?.age && <p className="text-xs text-muted-foreground mt-1">{user.age} yoshda</p>}
                </>
              )}

              <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                <User size={14} style={{ color: '#f5a623' }} /> {user?.email || 'Email biriktirilmagan'}
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl p-4" style={{ background: '#202024', border: '1px solid #2a2a30' }}>
              <p className="text-2xl font-black sm:text-3xl">{loading ? <Loader2 size={22} className="animate-spin text-muted-foreground"/> : favorites.length}</p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Heart size={12} className="text-amber-400" /> Sevimlilar
              </p>
            </div>

            <div className="rounded-2xl p-4" style={{ background: '#202024', border: '1px solid #2a2a30' }}>
              <p className="text-2xl font-black sm:text-3xl">{loading ? <Loader2 size={22} className="animate-spin text-muted-foreground"/> : historyCount}</p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={12} className="text-amber-400" /> Tomosha qilinganlar
              </p>
            </div>

            <div className="rounded-2xl p-4 flex flex-col justify-between" style={{ background: '#202024', border: '1px solid #2a2a30' }}>
              <div>
                <p className="text-2xl font-black">{user?.is_staff || user?.is_superuser ? 'Admin' : 'Foydalanuvchi'}</p>
                <p className="mt-1 text-xs text-muted-foreground">Maqom</p>
              </div>
              {(user?.is_staff || user?.is_superuser) && (
                <Link
                  href="/admin"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}
                >
                  <LayoutDashboard size={13} /> Admin Panel
                </Link>
              )}
            </div>
          </div>

          {/* Logout button */}
          <div className="mt-6 flex justify-stretch sm:justify-end">
            <button
              onClick={() => {
                logout()
                router.replace('/')
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition text-red-400 hover:bg-red-500/10 sm:w-auto"
              style={{ border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <LogOut size={16} /> Tizimdan chiqish
            </button>
          </div>
        </div>

        {/* Favorites Section */}
        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              Sevimli filmlaringiz
              {!loading && <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>{favorites.length}</span>}
            </h2>
            <Link href="/favorites" className="text-xs font-semibold" style={{ color: '#f5a623' }}>
              Barchasini ko&apos;rish →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-surface-2" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
              <p className="text-sm font-semibold">Sevimli filmlaringiz hali yo&apos;q</p>
              <p className="text-xs text-muted-foreground">Katalogdagi istalgan filmga yurakcha tugmasini bosing</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {favorites.slice(0, 6).map(item => (
                <Link key={item.id} href={`/movie/${item.id}`} className="group relative overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-[2/3] overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaImage(item) || '/placeholder.svg'} alt={mediaTitle(item)} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-6">
                    <p className="truncate text-xs font-medium text-white">{mediaTitle(item)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppChrome>
  )
}
