'use client'

import React, { type FormEvent, useState, useEffect } from 'react'
import Link from 'next/link'
import { Bookmark, MessageSquare, Play, Send, Star } from 'lucide-react'
import { api, type Comment, type Episode } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

type Props = {
  id: string | number
  title: string
  episodes: Episode[]
  initialComments: Comment[]
}

export default function SeriesDetailClient({ id, title, episodes = [], initialComments = [] }: Props) {
  const { isAuthenticated, user } = useAuth()
  const [favorite, setFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState<number | null>(null)
  const [rated, setRated] = useState(0)
  const [ratingId, setRatingId] = useState<number | null>(null)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [comment, setComment] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    if (isAuthenticated && user) {
      api.checkFavoriteSeries(id, user.id).then(res => {
        if (res) { setFavorite(true); setFavoriteId(res.id) }
      }).catch(() => {})
      api.seriesRating(id).then(res => {
        const myRating = res.results.find((r: any) => r.user === user.id)
        if (myRating) {
          setRated(myRating.stars)
          setRatingId(myRating.id)
        }
      }).catch(() => {})
    }
  }, [isAuthenticated, user, id])

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      showNotice("Iltimos, avval tizimga kiring")
      return
    }
    const prev = favorite
    setFavorite(!prev)
    try {
      if (!prev) {
        const res = await api.addFavoriteSeries(id)
        if (res && (res as any).id) setFavoriteId((res as any).id)
        showNotice("Sevimlilarga qo'shildi ⭐")
      } else {
        if (favoriteId) await api.removeFavoriteSeries(favoriteId)
        else await api.removeFavoriteSeries(id)
        showNotice("Sevimlilardan olib tashlandi")
        setFavoriteId(null)
      }
    } catch {
      setFavorite(prev)
      showNotice("Sevimlilarni saqlashda xatolik")
    }
  }

  const submitRating = async (val: number) => {
    if (!isAuthenticated) {
      showNotice("Iltimos, avval tizimga kiring")
      return
    }
    const prevRated = rated
    setRated(val)
    try {
      if (ratingId) {
        await api.updateSeriesRating(ratingId, val)
      } else {
        const res = await api.rateSeries(id, val)
        if (res && (res as any).id) setRatingId((res as any).id)
      }
      showNotice(`${val} yulduz baho saqlandi`)
    } catch (err: any) {
      setRated(prevRated)
      showNotice("Baho saqlanmadi")
    }
  }

  const postComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      showNotice("Izoh qoldirish uchun tizimga kiring")
      return
    }
    const text = comment.trim()
    if (!text) return
    setComment('')
    try {
      await api.addSeriesComment(id, text)
      setComments(prev => [{ id: Date.now(), text, username: user?.first_name || user?.email || 'Siz', created_at: new Date().toISOString() }, ...prev])
      showNotice("Izohingiz qoldirildi ✓")
    } catch {
      showNotice("Izoh yuborilmadi")
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Episodes Grid List */}
      <section className="rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <h2 className="mb-5 font-display text-xl font-bold text-[#F8FAFC]">
          Barcha qismlar ({episodes.length})
        </h2>
        {episodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[rgba(0,255,163,0.15)] py-8 text-center">
            <p className="text-sm text-[#64748B]">Ushbu serial uchun qismlar yuklanmoqda...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/watch/series/${id}/${ep.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-[rgba(0,255,163,0.15)] bg-[#0B1013] p-4 transition-all hover:border-[#00FFA3] hover:shadow-[0_0_15px_rgba(0,255,163,0.2)] hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#00FFA3]"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#00FFA3]">{ep.episode_number || ep.id}-qism</span>
                  <Play size={14} className="fill-current text-[#00FFA3] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </div>
                <span className="mt-3 truncate text-xs text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">
                  {ep.title || `Epizod ${ep.episode_number || ep.id}`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Actions: Favorite + Rating Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={toggleFavorite}
            aria-label={favorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
            className={`flex items-center gap-2.5 rounded-xl border px-5 py-3 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-[#00FFA3] active:scale-95 ${
              favorite
                ? 'border-[#00FFA3] bg-[rgba(0,255,163,0.15)] text-[#00FFA3] shadow-[0_0_15px_rgba(0,255,163,0.2)]'
                : 'border-[rgba(0,255,163,0.2)] bg-[#0B1013] text-[#64748B] hover:border-[#00FFA3] hover:text-[#F8FAFC]'
            }`}
          >
            <Bookmark size={18} className={favorite ? 'fill-current text-[#00FFA3]' : ''} aria-hidden="true" />
            <span>{favorite ? 'Saqlangan' : 'Sevimlilarga qo\'shish'}</span>
          </button>

          {notice && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-[#00FFA3] animate-in fade-in zoom-in duration-300">
              {notice}
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[#64748B]">Baho bering:</span>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Serialni baholash">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => submitRating(val)}
                onMouseEnter={() => setHoverRating(val)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${val} yulduz`}
                role="radio"
                aria-checked={rated === val}
                className="transition-transform hover:scale-110 active:scale-90 focus-visible:outline-2 focus-visible:outline-[#00FFA3] rounded-sm p-1"
              >
                <Star
                  size={24}
                  className={`transition-colors ${
                    val <= (hoverRating || rated)
                      ? 'fill-current text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'text-[#64748B] hover:text-[#94A3B8]'
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <section className="rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-[#F8FAFC]">
          <MessageSquare size={20} className="text-[#00FFA3]" aria-hidden="true" />
          Fikr va Izohlar ({comments.length})
        </h3>

        {/* Comment Form */}
        <form onSubmit={postComment} className="mb-10 flex flex-col items-end gap-3 sm:flex-row">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isAuthenticated ? 'Serial haqida fikringizni qoldiring...' : 'Izoh qoldirish uchun tizimga kiring'}
            disabled={!isAuthenticated}
            aria-label="Izoh matni"
            className="w-full rounded-2xl border border-[rgba(0,255,163,0.15)] bg-[#0B1013] px-5 py-4 text-sm text-[#F8FAFC] placeholder:text-[#64748B] outline-none focus:border-[#00FFA3] focus:ring-1 focus:ring-[#00FFA3] disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!isAuthenticated || !comment.trim()}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#00FFA3] px-8 text-sm font-bold text-[#070A0C] shadow-[0_0_15px_rgba(0,255,163,0.3)] transition hover:bg-[#1AFFA8] active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-[#00FFA3]"
          >
            <Send size={16} aria-hidden="true" /> Yuborish
          </button>
        </form>

        {/* Comments List */}
        <div className="flex flex-col gap-4">
          {comments.length === 0 ? (
            <p className="text-center text-sm text-[#64748B] py-8">
              Hali hech kim izoh qoldirmagan. Birinchi bo&apos;ling!
            </p>
          ) : (
            comments.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex gap-4 rounded-2xl bg-[#0B1013] p-5 border border-white/5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(0,255,163,0.15)] text-sm font-bold text-[#00FFA3] ring-1 ring-[#00FFA3]/30">
                  {typeof item.user === 'object' ? (item.user.first_name || item.user.email || 'U').charAt(0).toUpperCase() : (item.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F8FAFC]">
                      {typeof item.user === 'object' ? (item.user.first_name || item.user.email) : (item.username || 'Foydalanuvchi')}
                    </span>
                    <span className="text-xs text-[#64748B]">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Hozir'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#94A3B8]">{item.text || item.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
