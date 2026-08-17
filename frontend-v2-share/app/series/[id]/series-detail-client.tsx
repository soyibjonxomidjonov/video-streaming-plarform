'use client'

import React, { type FormEvent, useState } from 'react'
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
        await api.removeFavoriteSeries(id)
        setFavorite(false)
        showNotice("Sevimlilardan olib tashlandi")
      } else {
        await api.addFavoriteSeries(id)
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
      await api.rateSeries(id, val)
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
      <section className="rounded-3xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-[#f5f7f6]">
          Barcha qismlar ({episodes.length})
        </h2>
        {episodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[rgba(0,229,153,0.15)] py-8 text-center">
            <p className="text-xs text-[#8c9994]">Ushbu serial uchun qismlar yuklanmoqda...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/watch/series/${id}/${ep.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-[rgba(0,229,153,0.15)] bg-[#161f1c] p-3.5 transition hover:border-[#00e599] hover:shadow-[0_0_15px_rgba(0,229,153,0.2)] hover:scale-105"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#00e599]">{ep.episode_number || ep.id}-qism</span>
                  <Play size={12} fill="currentColor" className="text-[#00e599] opacity-0 group-hover:opacity-100 transition" />
                </div>
                <span className="mt-2 truncate text-[11px] text-[#8c9994] group-hover:text-[#f5f7f6]">
                  {ep.title || `Epizod ${ep.episode_number || ep.id}`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Actions: Favorite + Rating Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-5">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition active:scale-95 ${
              favorite
                ? 'border-[#00e599] bg-[rgba(0,229,153,0.2)] text-[#00e599]'
                : 'border-[rgba(0,229,153,0.2)] bg-[#161f1c] text-[#8c9994] hover:border-[#00e599] hover:text-[#f5f7f6]'
            }`}
          >
            <Bookmark size={16} className={favorite ? 'fill-current text-[#00e599]' : ''} />
            <span>{favorite ? 'Saqlangan' : 'Sevimlilarga qo\'shish'}</span>
          </button>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8c9994]">Baholash:</span>
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
                        : 'text-[#8c9994]/40'
                    }
                  />
                </button>
              ))}
            </div>
            {rated > 0 && <span className="text-xs font-bold text-[#ffb703]">({rated}/5)</span>}
          </div>
        </div>

        {notice && <p className="text-xs font-bold text-[#00e599]">{notice}</p>}
      </div>

      {/* Comments Section */}
      <section className="rounded-3xl border border-[rgba(0,229,153,0.15)] bg-[#101514] p-6">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare size={20} className="text-[#00e599]" />
          <h2 className="font-display text-lg font-bold text-[#f5f7f6]">
            Izohlar va Fikrlar ({comments.length})
          </h2>
        </div>

        {/* Comment Input */}
        <form onSubmit={postComment} className="mb-6 flex gap-2.5">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isAuthenticated ? 'Serial haqida fikringizni qoldiring...' : 'Izoh qoldirish uchun tizimga kiring'}
            disabled={!isAuthenticated}
            className="flex-1 rounded-xl border border-[rgba(0,229,153,0.18)] bg-[#161f1c] px-4 py-3 text-sm text-[#f5f7f6] outline-none disabled:opacity-50 focus:border-[#00e599]"
          />
          <button
            type="submit"
            disabled={!isAuthenticated || !comment.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[#00e599] px-6 py-3 text-xs font-bold text-[#080a0a] shadow-[0_0_12px_rgba(0,229,153,0.3)] transition hover:bg-[#1df2ad] disabled:opacity-40"
          >
            <Send size={14} /> Yuborish
          </button>
        </form>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[rgba(0,229,153,0.15)] py-10 text-center">
            <p className="text-xs text-[#8c9994]">Hali izohlar qoldirilmagan. Birinchi bo&apos;ling!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((item, idx) => (
              <div
                key={item.id || idx}
                className="rounded-2xl border border-[rgba(0,229,153,0.08)] bg-[#161f1c]/70 p-4"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#00e599]">
                    {typeof item.user === 'object' ? (item.user.first_name || item.user.email) : (item.username || 'Foydalanuvchi')}
                  </span>
                  <span className="text-[10px] text-[#8c9994]">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('uz-UZ') : 'Hozir'}
                  </span>
                </div>
                <p className="text-xs text-[#f5f7f6] leading-relaxed">{item.text || item.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
