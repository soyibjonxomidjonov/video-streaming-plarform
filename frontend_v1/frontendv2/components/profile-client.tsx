'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LogOut, Pencil, Check, User, Loader2,
  LayoutDashboard, Bookmark, Clock, ShieldAlert, Sparkles, Upload,
} from 'lucide-react'
import { api, getImageUrl, unwrapList, type MediaItem } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import MediaCard from '@/components/media-card'

export default function ProfileClient() {
  const { user, logout, refresh, isAdmin } = useAuth()
  const router = useRouter()

  const [favorites, setFavorites] = useState<MediaItem[]>([])
  const [historyCount, setHistoryCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Edit state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [profileAvatar, setProfileAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
      setAge(user.age ? String(user.age) : '')
      
      // Load avatar from backend directly!
      if (!profileAvatar && user.picture) {
        setProfileAvatar(user.picture)
      }
    }
  }, [user])

  useEffect(() => {
    let active = true
    async function loadUserData() {
      try {
        const [favRes, histRes] = await Promise.allSettled([
          api.favoritesMovie(),
          api.historyMovie(),
        ])
        if (!active) return
        if (favRes.status === 'fulfilled') {
          const rawFavs = unwrapList(favRes.value) as any[]
          const favItems = rawFavs.map((r) => r.movie ?? r).filter(Boolean) as MediaItem[]
          setFavorites(favItems)
        }
        if (histRes.status === 'fulfilled') {
          setHistoryCount(unwrapList(histRes.value).length)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadUserData()
    return () => { active = false }
  }, [])

  const showToast = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setNotice(null)
    try {
      // Backendga FormData orqali yuborish (Rasm ham ketadi)
      if (user) {
        const formData = new FormData()
        formData.append('first_name', firstName.trim())
        formData.append('last_name', lastName.trim())
        if (age) formData.append('age', String(age))

        // Agar yangi rasm tanlangan bo'lsa (base64)
        if (profileAvatar && profileAvatar.startsWith('data:')) {
          const res = await fetch(profileAvatar)
          const blob = await res.blob()
          formData.append('picture', blob, 'avatar.webp')
        }

        await api.updateUser('me', formData)
      }

      await refresh()
      showToast("Profil muvaffaqiyatli saqlandi ✓")
    } catch {
      showToast("Profilni saqlashda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 3 MB limit (3 * 1024 * 1024 bytes)
    if (file.size > 3 * 1024 * 1024) {
      showToast("Rasm hajmi 3 MB dan oshmasligi kerak!")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      
      const saveAndDispatch = (base64Str: string) => {
        setProfileAvatar(base64Str)
        try {
          localStorage.setItem('streamora_profile_avatar', base64Str)
          window.dispatchEvent(new Event('profile_updated'))
        } catch (err) {
          console.error("Rasm hajmi juda katta, saqlab bo'lmadi")
        }
      }

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 256
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          const compressedBase64 = canvas.toDataURL('image/webp', 0.8)
          saveAndDispatch(compressedBase64)
        } catch (err) {
          saveAndDispatch(reader.result as string)
        }
      }
      
      img.onerror = () => {
        saveAndDispatch(reader.result as string)
      }
      
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email || ''

  const userInitials = (user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ''}`
    : user?.email?.slice(0, 2) ?? 'SM'
  ).toUpperCase()

  return (
    <div className="w-full min-w-0 space-y-8 max-w-7xl mx-auto">
      {/* ── Page title ── */}
      <div className="min-w-0">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">Profilim</h1>
        <p className="mt-2 text-base text-[#64748B]">Shaxsiy ma&apos;lumotlaringizni boshqaring</p>
      </div>

      {/* ── Avatar Header Card ── */}
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-[#0F171A] border border-[#00FFA3]/15 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative shrink-0">
          <div className="size-28 sm:size-32 rounded-full border-2 border-[#00FFA3] shadow-[0_0_30px_rgba(0,255,163,0.3)] overflow-hidden">
            {profileAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getImageUrl(profileAvatar)} alt="Avatar" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#0D4D38] to-[#00FFA3]">
                <span className="font-display text-4xl font-black text-[#070A0C]">
                  {userInitials}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex size-10 items-center justify-center rounded-full border border-[rgba(0,255,163,0.3)] bg-[#141F24] text-[#00FFA3] shadow-lg transition hover:bg-[#00FFA3] hover:text-[#070A0C] hover:scale-110"
            title="Avatar yuklash"
          >
            <Upload size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">{displayName}</h2>
          <p className="mt-1 text-base text-emerald-400 font-medium">{user?.email}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-xl border border-[rgba(0,255,163,0.25)] bg-[rgba(0,255,163,0.08)] px-4 py-2 text-sm font-bold text-[#00FFA3] transition hover:bg-[rgba(0,255,163,0.18)]"
              >
                <ShieldAlert size={16} />
                Admin Panel
              </Link>
            )}
            <Link
              href="/favorites"
              className="flex items-center gap-2 rounded-xl border border-[rgba(0,255,163,0.15)] bg-[#141F24] px-4 py-2 text-sm font-medium text-[#94A3B8] transition hover:text-[#F8FAFC]"
            >
              <Sparkles size={16} />
              AI Voice yoqilgan
            </Link>
          </div>
        </div>
      </div>

      {/* ── Statistics Cards ── */}
      <div className="grid w-full min-w-0 grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          href="/favorites"
          className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[rgba(0,255,163,0.12)] bg-[#0F171A] p-5 transition hover:border-[rgba(0,255,163,0.3)] hover:bg-[#141F24]"
        >
          <div className="flex size-12 items-center justify-center rounded-xl border border-[rgba(0,255,163,0.2)] bg-[rgba(0,255,163,0.08)] text-[#00FFA3]">
            <Bookmark size={20} />
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold text-[#F8FAFC]">
              {loading ? '—' : favorites.length}
            </p>
            <p className="text-sm text-[#64748B]">Sevimlilar</p>
          </div>
        </Link>

        <Link
          href="/history"
          className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[rgba(0,255,163,0.12)] bg-[#0F171A] p-5 transition hover:border-[rgba(0,255,163,0.3)] hover:bg-[#141F24]"
        >
          <div className="flex size-12 items-center justify-center rounded-xl border border-[rgba(0,255,163,0.2)] bg-[rgba(0,255,163,0.08)] text-[#00FFA3]">
            <Clock size={20} />
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold text-[#F8FAFC]">
              {loading ? '—' : historyCount}
            </p>
            <p className="text-sm text-[#64748B]">Ko&apos;rilgan</p>
          </div>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[rgba(0,255,163,0.12)] bg-[#0F171A] p-5 transition hover:border-[rgba(0,255,163,0.3)] hover:bg-[#141F24]"
          >
            <div className="flex size-12 items-center justify-center rounded-xl border border-[rgba(0,255,163,0.2)] bg-[rgba(0,255,163,0.08)] text-[#00FFA3]">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <p className="font-display text-base font-extrabold text-[#F8FAFC]">Admin</p>
              <p className="text-sm text-[#64748B]">Boshqaruv</p>
            </div>
          </Link>
        )}

        <Link
          href="/settings"
          className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[rgba(0,255,163,0.12)] bg-[#0F171A] p-5 transition hover:border-[rgba(0,255,163,0.3)] hover:bg-[#141F24]"
        >
          <div className="flex size-12 items-center justify-center rounded-xl border border-[rgba(0,255,163,0.2)] bg-[rgba(0,255,163,0.08)] text-[#00FFA3]">
            <User size={20} />
          </div>
          <div>
            <p className="font-display text-base font-extrabold text-[#F8FAFC]">Sozlamalar</p>
            <p className="text-sm text-[#64748B]">Hisob</p>
          </div>
        </Link>
      </div>

      {/* ── Profile Edit Form ── */}
      <div className="w-full min-w-0 rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <Pencil size={20} className="text-[#00FFA3]" />
          <h2 className="font-display text-xl font-bold text-[#F8FAFC]">Shaxsiy Ma&apos;lumotlar</h2>
        </div>

        {notice && (
          <div className="mb-6 rounded-2xl border border-[rgba(0,255,163,0.25)] bg-[rgba(0,255,163,0.08)] px-5 py-4 text-base font-medium text-[#00FFA3]">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-6">
          {/* First Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">Ism</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ismingiz"
              className="h-14 px-5 text-base rounded-2xl bg-[#0B1013] border border-[#00FFA3]/20 text-white focus:border-[#00FFA3] focus:ring-2 focus:ring-[#00FFA3]/30 outline-none w-full transition-all"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">Familiya</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Familiyangiz"
              className="h-14 px-5 text-base rounded-2xl bg-[#0B1013] border border-[#00FFA3]/20 text-white focus:border-[#00FFA3] focus:ring-2 focus:ring-[#00FFA3]/30 outline-none w-full transition-all"
            />
          </div>

          {/* Age */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">Yosh</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Yoshingiz"
              min={5}
              max={120}
              className="h-14 px-5 text-base rounded-2xl bg-[#0B1013] border border-[#00FFA3]/20 text-white focus:border-[#00FFA3] focus:ring-2 focus:ring-[#00FFA3]/30 outline-none w-full transition-all"
            />
          </div>

          {/* Email (read-only) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="h-14 px-5 text-base rounded-2xl border border-[rgba(0,255,163,0.1)] bg-[#0B1013] text-[#64748B] outline-none cursor-not-allowed w-full"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center justify-start border-t border-[#00FFA3]/15 pt-6">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center justify-center gap-3 px-8 py-4 text-base font-bold bg-[#00FFA3] text-black rounded-2xl hover:shadow-[0_0_25px_rgba(0,255,163,0.5)] transition-all active:scale-95 disabled:opacity-60 disabled:hover:shadow-none"
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Check size={20} />
            )}
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 px-6 py-4 text-base font-semibold border-2 border-red-500/40 text-red-400 rounded-2xl hover:bg-red-500/10 transition-all active:scale-95 ml-auto"
          >
            <LogOut size={20} />
            Tizimdan chiqish
          </button>
        </div>
      </div>

      {/* ── Favorites Grid ── */}
      {!loading && favorites.length > 0 && (
        <div className="w-full min-w-0 mt-12">
          <div className="mb-6 flex min-w-0 items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-bold text-[#F8FAFC]">Sevimli Filmlar</h2>
            <Link href="/favorites" className="text-sm font-medium text-[#00FFA3] hover:underline transition">
              Barchasi →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full min-w-0">
            {favorites.slice(0, 10).map((item, index) => (
              <div key={item.id || (item as any)._id || `fav-item-${index}`} className="min-w-0 w-full">
                <MediaCard item={item} type={item.type || 'movie'} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
