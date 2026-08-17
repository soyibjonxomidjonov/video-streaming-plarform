'use client'

import React, { type FormEvent, useState } from 'react'
import { Bookmark, MessageSquare, Send, Star, AlertCircle } from 'lucide-react'
import { api, type Comment } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

type Props = {
  id: string | number
  type: 'movie' | 'series'
  streamUrl: string
  title: string
  initialComments: Comment[]
}

export default function MovieDetailClient({ id, type, title, initialComments }: Props) {
  const { isAuthenticated, user } = useAuth()
  const [favorite, setFavorite] = useState(false)
  const [rated, setRated] = useState(0)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [comment, setComment] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [hoverRating, setHoverRating] = useState(0)

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      showNotice("Iltimos, avval tizimga kiring")
      return
    }
    try {
      if (favorite) {
        if (type === 'movie') await api.removeFavoriteMovie(id)
        else await api.removeFavoriteSeries(id)
        setFavorite(false)
        showNotice("Sevimlilardan olib tashlandi")
      } else {
        if (type === 'movie') await api.addFavoriteMovie(id)
        else await api.addFavoriteSeries(id)
        setFavorite(true)
        showNotice("Sevimlilarga qo'shildi ⭐")
      }
    } catch {
      showNotice("Sevimlilarni saqlashda xatolik")
    }
  }

  const submitRating = async (val: number) => {
    if (!isAuthenticated) {
      showNotice("Iltimos, avval tizimga kiring")
      return
    }
    setRated(val)
    try {
      if (type === 'movie') await api.rateMovie(id, val)
      else await api.rateSeries(id, val)
      showNotice(`${val} yulduz baho saqlandi`)
    } catch {
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
      if (type === 'movie') await api.addMovieComment(id, text)
      else await api.addSeriesComment(id, text)
      setComments(prev => [{ id: Date.now(), text, username: user?.first_name || user?.email || 'Siz', created_at: new Date().toISOString() }, ...prev])
      showNotice("Izohingiz qoldirildi ✓")
    } catch {
      showNotice("Izoh yuborilmadi")
    }
  }

  return (
    <div className="flex flex-col gap-8">
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

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748B]">Baholash:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => submitRating(val)}
                  onMouseEnter={() => setHoverRating(val)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition hover:scale-125"
                  title={`${val} yulduz`}
                >
                  <Star
                    size={18}
                    className={
                      val <= (hoverRating || rated)
                        ? 'fill-[#ffb703] text-[#ffb703]'
                        : 'text-[#64748B]/40'
                    }
                  />
                </button>
              ))}
            </div>
            {rated > 0 && <span className="text-xs font-bold text-[#ffb703]">({rated}/5)</span>}
          </div>
        </div>

        {notice && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-[#00FFA3] animate-in fade-in zoom-in duration-300">
            <AlertCircle size={14} aria-hidden="true" /> {notice}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-[#F8FAFC]">
          <MessageSquare size={20} className="text-[#00FFA3]" aria-hidden="true" />
          Fikr va Izohlar ({comments.length})
        </h3>

        {/* Comment Form */}
        <form onSubmit={postComment} className="mb-10 flex flex-col items-end gap-3 sm:flex-row">
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={isAuthenticated ? "Fikringizni qoldiring..." : "Izoh qoldirish uchun tizimga kiring"}
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
              <div key={item.id || idx} className="flex gap-4 rounded-2xl bg-[#0B1013] p-5 border border-white/5">
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
      </div>
    </div>
  )
}
