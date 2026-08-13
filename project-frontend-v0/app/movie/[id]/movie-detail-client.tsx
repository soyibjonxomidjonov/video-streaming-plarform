'use client'

import { type FormEvent, useState } from 'react'
import { Heart, MessageCircle, Send, Star } from 'lucide-react'
import { api, ApiError, commentAuthor, commentText, type Comment } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

type Props = {
  id: string
  type: 'movie' | 'series'
  streamUrl: string
  title: string
  initialComments: Comment[]
}

export default function MovieDetailClient({ id, type, title, initialComments }: Props) {
  const { isAuthenticated } = useAuth()
  const [favorite, setFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState<number | null>(null)
  const [rated, setRated] = useState(0)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [comment, setComment] = useState('')
  const [notice, setNotice] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const toggleFavorite = async () => {
    if (!isAuthenticated) { showNotice('Iltimos, avval tizimga kiring.'); return }
    try {
      if (favorite && favoriteId) {
        if (type === 'movie') await api.unfavoriteMovie(favoriteId)
        else await api.unfavoriteSeries(favoriteId)
        setFavorite(false)
        setFavoriteId(null)
        showNotice('Sevimlilardan olib tashlandi')
      } else {
        const res = type === 'movie'
          ? await api.favoriteMovie(Number(id))
          : await api.favoriteSeries(Number(id))
        setFavorite(true)
        setFavoriteId(res.id)
        showNotice('Sevimlilarga qo\'shildi ⭐')
      }
    } catch {
      showNotice('Xatolik yuz berdi. Qaytadan urining.')
    }
  }

  const submitRating = async (value: number) => {
    if (!isAuthenticated) { showNotice('Iltimos, avval tizimga kiring.'); return }
    setRated(value)
    try {
      if (type === 'movie') await api.rateMovie(Number(id), value)
      else await api.rateSeries(Number(id), value)
      showNotice(`${value} yulduz baho qo'yildi`)
    } catch {
      showNotice('Baho saqlanmadi.')
    }
  }

  const postComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) { showNotice('Iltimos, avval tizimga kiring.'); return }
    const text = comment.trim()
    if (!text) return
    setComment('')
    try {
      const created = type === 'movie'
        ? await api.commentMovie(Number(id), text)
        : await api.commentSeries(Number(id), text)
      setComments(prev => [created ?? { id: Date.now(), text }, ...prev])
      showNotice('Izoh qoldirildi ✓')
    } catch (err) {
      showNotice(err instanceof ApiError ? err.message : 'Izoh saqlanmadi.')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Actions: Favorite + Rating */}
      <div
        className="flex flex-wrap items-center gap-4 rounded-2xl p-5"
        style={{ background: '#16161a', border: '1px solid #2a2a30' }}
      >
        {/* Favorite */}
        <button
          id="detail-favorite-btn"
          onClick={toggleFavorite}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95"
          style={
            favorite
              ? { background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.3)' }
              : { background: '#202024', color: '#9a9aa2', border: '1px solid #2a2a30' }
          }
        >
          <Heart size={16} className={favorite ? 'fill-current' : ''} />
          {favorite ? 'Sevimlilarda' : 'Sevimlilarga qo\'shish'}
        </button>

        {/* Rating stars */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Baho:</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                id={`star-${val}`}
                onClick={() => void submitRating(val)}
                onMouseEnter={() => setHoverRating(val)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${val} yulduz`}
                className="transition hover:scale-110"
              >
                <Star
                  size={22}
                  style={
                    val <= (hoverRating || rated)
                      ? { fill: '#f5a623', color: '#f5a623' }
                      : { color: '#2a2a30' }
                  }
                />
              </button>
            ))}
          </div>
          {rated > 0 && (
            <span className="text-sm font-semibold" style={{ color: '#f5a623' }}>({rated}/5)</span>
          )}
        </div>

        {/* Notice */}
        {notice && (
          <p className="ml-auto text-sm font-medium" style={{ color: '#22c55e' }}>{notice}</p>
        )}
      </div>

      {/* Comments section */}
      <section id="comments-section">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <MessageCircle size={20} style={{ color: '#f5a623' }} />
          Izohlar
          {comments.length > 0 && (
            <span className="rounded-full px-2.5 py-0.5 text-sm font-semibold" style={{ background: 'rgba(245,166,35,0.12)', color: '#f5a623' }}>
              {comments.length}
            </span>
          )}
        </h2>

        {/* Comment form */}
        <form onSubmit={postComment} className="mb-6 flex gap-2">
          <input
            id="comment-input"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={isAuthenticated ? 'Fikringizni yozing...' : 'Izoh qoldirish uchun tizimga kiring'}
            disabled={!isAuthenticated}
            className="flex-1 rounded-xl px-4 py-3 text-sm outline-none disabled:opacity-50"
            style={{ background: '#16161a', border: '1px solid #2a2a30' }}
          />
          <button
            id="comment-submit"
            type="submit"
            disabled={!isAuthenticated || !comment.trim()}
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
            aria-label="Izoh yuborish"
          >
            <Send size={16} />
          </button>
        </form>

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">Hali izoh yo&apos;q. Birinchi bo&apos;ling!</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map(item => (
              <li
                key={item.id}
                className="rounded-xl p-4 animate-fade-in"
                style={{ background: '#16161a', border: '1px solid #2a2a30' }}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <div
                    className="flex size-7 items-center justify-center rounded-full text-xs font-bold text-black"
                    style={{ background: '#f5a623' }}
                  >
                    {commentAuthor(item).slice(0, 1).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold">{commentAuthor(item)}</p>
                  {item.created_at && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                    </span>
                  )}
                </div>
                <p className="ml-9 text-sm leading-relaxed text-muted-foreground">{commentText(item)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
