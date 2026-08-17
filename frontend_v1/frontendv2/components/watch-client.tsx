'use client'

import React, {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  memo,
} from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Play,
  Bookmark,
  Star,
  Send,
  AlertCircle,
  Loader2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  api,
  mediaTitle,
  mediaImage,
  type Comment,
  type Episode,
  type MediaItem,
} from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */
type Props = {
  id: string | number
  type: 'movie' | 'series'
  title: string
  poster?: string
  streamUrl: string
  description?: string
  rating?: number | null
  year?: number | string | null
  episodes?: Episode[]
  initialComments?: Comment[]
}

/* ──────────────────────────────────────────────
   Comments List — isolated to prevent re-renders
   from video timeupdate propagating here
────────────────────────────────────────────── */
const CommentsList = memo(function CommentsList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[#64748B]">
        Hozircha izoh yo&apos;q. Birinchi bo&apos;ling!
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {comments.map((c, i) => (
        <div
          key={c.id || i}
          className="rounded-xl border border-[rgba(0,255,163,0.08)] bg-[#141F24]/80 p-3.5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#00FFA3]">
              {typeof c.user === 'object'
                ? c.user.first_name || c.user.email
                : c.username || 'Foydalanuvchi'}
            </span>
            <span className="text-[#64748B]">
              {c.created_at ? new Date(c.created_at).toLocaleDateString('uz-UZ') : 'Hozir'}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[#F8FAFC] leading-relaxed">{c.text || c.content}</p>
        </div>
      ))}
    </div>
  )
})

/* ──────────────────────────────────────────────
   Episode Grid — isolated
────────────────────────────────────────────── */
const EpisodeGrid = memo(function EpisodeGrid({
  episodes,
  activeId,
  onSelect,
}: {
  episodes: Episode[]
  activeId?: number
  onSelect: (ep: Episode) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {episodes.map((ep) => {
        const isActive = activeId === ep.id
        return (
          <button
            key={ep.id}
            onClick={() => onSelect(ep)}
            className={`flex flex-col rounded-xl border p-2.5 text-left transition min-h-[44px] ${
              isActive
                ? 'border-[#00FFA3] bg-[rgba(0,255,163,0.14)] shadow-[0_0_12px_rgba(0,255,163,0.2)]'
                : 'border-[rgba(0,255,163,0.1)] bg-[#141F24] hover:border-[rgba(0,255,163,0.3)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold text-[#00FFA3]">
                {ep.episode_number || ep.id}
              </span>
              {isActive && <Play size={10} fill="currentColor" className="text-[#00FFA3]" />}
            </div>
            <span className="mt-0.5 truncate text-[10px] text-[#64748B]">
              {ep.title || `Qism ${ep.episode_number || ''}`}
            </span>
          </button>
        )
      })}
    </div>
  )
})

/* ──────────────────────────────────────────────
   Main WatchClient
────────────────────────────────────────────── */
export default function WatchClient({
  id,
  type,
  title,
  poster,
  streamUrl,
  description,
  rating,
  year,
  episodes = [],
  initialComments = [],
}: Props) {
  const { isAuthenticated, user } = useAuth()
  const { registerPlayer, unregisterPlayer } = useVoiceAssistant()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(episodes[0] ?? null)
  const [currentStream, setCurrentStream] = useState(streamUrl)
  const [videoLoading, setVideoLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  /* Isolated interaction state — does NOT affect video */
  const [favorite, setFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState<number | null>(null)
  const [progressId, setProgressId] = useState<number | null>(null)
  const [rated, setRated] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [notice, setNotice] = useState<string | null>(null)

  const targetId = type === 'series' ? (activeEpisode?.id ?? id) : id

  // Dastlabki holatni tekshirish (favorite va progress uchun)
  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    async function checkData() {
      try {
        if (type === 'movie') {
          const [fav, prog] = await Promise.all([
            api.checkFavoriteMovie(id),
            api.checkProgressMovie(id)
          ])
          if (!active) return
          setFavorite(!!fav)
          setFavoriteId(fav?.id ?? null)
          setProgressId(prog?.id ?? null)
        } else if (activeEpisode?.id) {
          const [fav, prog] = await Promise.all([
            api.checkFavoriteSeries(id),
            api.checkProgressSeries(activeEpisode.id)
          ])
          if (!active) return
          setFavorite(!!fav)
          setFavoriteId(fav?.id ?? null)
          setProgressId(prog?.id ?? null)
        }
      } catch {}
    }
    void checkData()
    return () => { active = false }
  }, [isAuthenticated, type, id, activeEpisode?.id])

  const showToast = useCallback((msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }, [])

  /* ── Progress Saver ── */
  const saveProgress = useCallback(async () => {
    if (!isAuthenticated) return
    const video = videoRef.current
    if (!video || !video.currentTime) return
    const pos = Math.round(video.currentTime)
    try {
      if (type === 'movie') {
        if (progressId) {
          await api.updateProgressMovie(progressId, pos)
        } else {
          const res = await api.progressMovie(Number(id), pos)
          if (res?.id) setProgressId(res.id)
        }
      } else if (activeEpisode?.id) {
        if (progressId) {
          await api.updateProgressSeries(progressId, pos)
        } else {
          const res = await api.progressSeries(activeEpisode.id, pos)
          if (res?.id) setProgressId(res.id)
        }
      }
    } catch {}
  }, [id, type, activeEpisode, isAuthenticated, progressId])

  useEffect(() => {
    const timer = setInterval(saveProgress, 12000)
    return () => {
      clearInterval(timer)
      saveProgress()
    }
  }, [saveProgress])

  /* ── Video Error Handling ── */
  const handleVideoError = useCallback(() => {
    setVideoLoading(false)
    if (retryCount < 1) {
      setRetryCount((prev) => prev + 1)
      showToast('Video yuklanmoqda, qayta ulanish...')
      setTimeout(() => {
        if (videoRef.current) videoRef.current.load()
      }, 1500)
    } else {
      setError("Video oqimini yuklashda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.")
    }
  }, [retryCount, showToast])

  /* ── Episode Navigation ── */
  const selectEpisode = useCallback((ep: Episode) => {
    saveProgress()
    setActiveEpisode(ep)
    setCurrentStream(api.episodeStream(ep.id))
    setError(null)
    setVideoLoading(true)
    setRetryCount(0)
  }, [saveProgress])

  const playNext = useCallback(() => {
    if (type !== 'series' || !activeEpisode) return
    const idx = episodes.findIndex((e) => e.id === activeEpisode.id)
    if (idx !== -1 && idx < episodes.length - 1) selectEpisode(episodes[idx + 1])
  }, [type, activeEpisode, episodes, selectEpisode])

  const playPrevious = useCallback(() => {
    if (type !== 'series' || !activeEpisode) return
    const idx = episodes.findIndex((e) => e.id === activeEpisode.id)
    if (idx > 0) selectEpisode(episodes[idx - 1])
  }, [type, activeEpisode, episodes, selectEpisode])

  /* ── Favorites ── */
  const toggleFavorite = useCallback(async () => {
    if (!isAuthenticated) { showToast('Iltimos, avval tizimga kiring'); return }
    try {
      if (favorite) {
        // Agar allaqachon sevimlilarda bo'lsa, o'chiramiz (ID orqali)
        if (favoriteId) {
          if (type === 'movie') await api.removeFavoriteMovie(favoriteId)
          else await api.removeFavoriteSeries(favoriteId)
        } else {
          // Ehtiyot chorasi, ID yo'q bo'lsa
          if (type === 'movie') await api.removeFavoriteMovie(id)
          else await api.removeFavoriteSeries(id)
        }
        setFavorite(false)
        setFavoriteId(null)
        showToast('Sevimlilardan olib tashlandi')
      } else {
        let res;
        if (type === 'movie') res = await api.addFavoriteMovie(id)
        else res = await api.addFavoriteSeries(id)
        setFavorite(true)
        setFavoriteId(res?.id ?? null)
        showToast("Sevimlilarga qo'shildi ⭐")
      }
    } catch {
      showToast('Xatolik yuz berdi')
    }
  }, [isAuthenticated, favorite, favoriteId, type, id, showToast])

  /* ── Rating ── */
  const handleRate = useCallback(async (stars: number) => {
    if (!isAuthenticated) { showToast('Iltimos, avval tizimga kiring'); return }
    setRated(stars)
    try {
      if (type === 'movie') await api.rateMovie(id, stars)
      else await api.rateSeries(id, stars)
      showToast(`${stars} yulduz baho saqlandi`)
    } catch {
      showToast('Baho saqlanmadi')
    }
  }, [isAuthenticated, type, id, showToast])

  /* ── Comment Submit ── */
  const handleAddComment = useCallback(async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const text = commentText.trim()
    if (!text) return
    if (!isAuthenticated) { showToast('Izoh qoldirish uchun tizimga kiring'); return }
    setCommentText('')
    try {
      if (type === 'movie') await api.addMovieComment(id, text)
      else await api.addSeriesComment(id, text)
      setComments((prev) => [
        {
          id: Date.now(),
          text,
          username: user?.first_name || user?.email || 'Siz',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      showToast("Izohingiz qo'shildi ✓")
    } catch {
      showToast('Izoh yuborilmadi')
    }
  }, [commentText, isAuthenticated, type, id, user, showToast])

  /* ── Voice Assistant Bridge ── */
  useEffect(() => {
    registerPlayer({
      videoRef,
      contentType: type,
      contentId: targetId,
      contentTitle: title,
      hasNextEpisode: () => {
        if (type !== 'series' || !activeEpisode) return false
        const idx = episodes.findIndex((e) => e.id === activeEpisode.id)
        return idx < episodes.length - 1
      },
      hasPreviousEpisode: () => {
        if (type !== 'series' || !activeEpisode) return false
        const idx = episodes.findIndex((e) => e.id === activeEpisode.id)
        return idx > 0
      },
      nextEpisode: playNext,
      previousEpisode: playPrevious,
      toggleFavorite,
      rate: handleRate,
      addComment: async (text: string) => {
        setCommentText(text)
        await handleAddComment()
      },
    })
    return unregisterPlayer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEpisode?.id, targetId, title, favorite])

  const hasNext = type === 'series' && activeEpisode
    ? episodes.findIndex((e) => e.id === activeEpisode.id) < episodes.length - 1
    : false
  const hasPrev = type === 'series' && activeEpisode
    ? episodes.findIndex((e) => e.id === activeEpisode.id) > 0
    : false

  return (
    <div className="w-full min-w-0 flex flex-col gap-5 py-4">
      {/* ── Top Navigation ── */}
      <div className="flex min-w-0 items-center justify-between gap-3">
        <Link
          href={type === 'movie' ? `/movie/${id}` : `/series/${id}`}
          aria-label="Ortga qaytish"
          className="flex items-center gap-2 rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] px-3.5 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:border-[#00FFA3] hover:text-[#00FFA3] active:scale-95 min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Ortga qaytish</span>
        </Link>

        <div className="flex items-center gap-2">
          {type === 'series' && (
            <>
              <button
                onClick={playPrevious}
                disabled={!hasPrev}
                aria-label="Oldingi qism"
                className="flex size-9 items-center justify-center rounded-xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] text-[#94A3B8] transition hover:border-[rgba(0,255,163,0.35)] hover:text-[#00FFA3] disabled:opacity-30 min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-[#00FFA3]"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                onClick={playNext}
                disabled={!hasNext}
                aria-label="Keyingi qism"
                className="flex size-9 items-center justify-center rounded-xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] text-[#94A3B8] transition hover:border-[rgba(0,255,163,0.35)] hover:text-[#00FFA3] disabled:opacity-30 min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-[#00FFA3]"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </>
          )}
          <span className="rounded-xl border border-[rgba(0,255,163,0.25)] bg-[rgba(0,255,163,0.08)] px-3 py-1.5 text-xs font-bold text-[#00FFA3]">
            {type === 'series' && activeEpisode
              ? `Ep. ${activeEpisode.episode_number || ''}`
              : 'HD 1080p'}
          </span>
        </div>
      </div>

      {/* ── Video Stage ── */}
      <div className="w-full min-w-0">
        <div className="relative w-full aspect-video max-h-[75vh] overflow-hidden rounded-2xl border border-[rgba(0,255,163,0.2)] bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(0,255,163,0.1)]">
          <video
            ref={videoRef}
            data-role="main-player"
            preload="metadata"
            controls
            playsInline
            poster={poster}
            className="size-full object-contain"
            onWaiting={() => setVideoLoading(true)}
            onPlaying={() => setVideoLoading(false)}
            onLoadedData={() => setVideoLoading(false)}
            onError={handleVideoError}
          >
            <source src={currentStream} type="video/mp4" />
            Brauzeringiz video formatini qo&apos;llab-quvvatlamaydi.
          </video>

          {/* Loading Spinner */}
          {videoLoading && !error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="size-10 rounded-full border-[3px] border-[rgba(0,255,163,0.2)] border-t-[#00FFA3] animate-spin shadow-[0_0_10px_rgba(0,255,163,0.4)]" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-6">
              <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-[#EF4444]/30 bg-[#0F171A] p-6 text-center shadow-2xl">
                <AlertCircle size={32} className="text-[#EF4444]" />
                <p className="text-sm font-medium text-[#F8FAFC]">{error}</p>
                <button
                  onClick={() => { setError(null); setVideoLoading(true); if (videoRef.current) videoRef.current.load() }}
                  className="rounded-xl bg-[#00FFA3] px-5 py-2 text-xs font-bold text-[#070A0C] transition hover:bg-[#1AFFA8] min-h-[44px]"
                >
                  Qayta urinish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Action Panel ── */}
      <div className="w-full min-w-0 rounded-2xl border border-[rgba(0,255,163,0.12)] bg-[#0F171A]/80 p-4 sm:p-6 backdrop-blur-sm">
        {/* Title & Actions Row */}
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Title */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00FFA3]">
              <span>{type === 'series' ? 'Serial' : 'Film'}</span>
              {year && <><span>•</span><span>{year}</span></>}
            </div>
            <h1 className="mt-1 font-display text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#F8FAFC]">
              {title}
              {activeEpisode ? ` — ${activeEpisode.episode_number}-qism` : ''}
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={toggleFavorite}
              aria-label={favorite ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
              aria-pressed={favorite}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-1 ${
                favorite
                  ? 'border-[#00FFA3] bg-[rgba(0,255,163,0.15)] text-[#00FFA3]'
                  : 'border-[rgba(0,255,163,0.18)] bg-[#141F24] text-[#94A3B8] hover:border-[rgba(0,255,163,0.4)] hover:text-[#F8FAFC]'
              }`}
            >
              <Bookmark size={15} aria-hidden="true" className={favorite ? 'fill-current' : ''} />
              <span className="hidden sm:inline">{favorite ? 'Saqlangan' : '+ Sevimlilarga'}</span>
            </button>

            {/* Star Rating */}
            <div
              className="flex items-center gap-1 rounded-xl border border-[rgba(0,255,163,0.12)] bg-[#141F24] px-3 py-2.5 min-h-[44px]"
              role="group"
              aria-label="Baholash"
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleRate(s)}
                  aria-label={`${s} yulduz baho berish`}
                  aria-pressed={rated === s}
                  className="text-[#64748B] transition hover:scale-125 hover:text-[#F59E0B] p-0.5 focus-visible:outline-2 focus-visible:outline-[#F59E0B] focus-visible:rounded-sm"
                >
                  <Star
                    size={14}
                    aria-hidden="true"
                    className={rated >= s || (rating && Number(rating) >= s) ? 'fill-[#F59E0B] text-[#F59E0B]' : ''}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">{description}</p>
        )}

        {/* Episode Selector */}
        {type === 'series' && episodes.length > 0 && (
          <div className="mt-5 border-t border-[rgba(0,255,163,0.08)] pt-5">
            <h2 className="mb-3 font-display text-xs font-black uppercase tracking-widest text-[#00FFA3]">
              Qismlar ro&apos;yxati ({episodes.length})
            </h2>
            <EpisodeGrid
              episodes={episodes}
              activeId={activeEpisode?.id}
              onSelect={selectEpisode}
            />
          </div>
        )}

        {/* Comments */}
        <div className="mt-5 border-t border-[rgba(0,255,163,0.08)] pt-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-[#00FFA3]" />
            <h2 className="font-display text-sm font-bold text-[#F8FAFC]">
              Fikr va Mulohazalar ({comments.length})
            </h2>
          </div>

          {/* Comment Form */}
          <form
            onSubmit={handleAddComment}
            className="flex flex-col gap-2.5 sm:flex-row"
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Fikringizni qoldiring..."
              className="flex-1 min-w-0 rounded-xl border border-[rgba(0,255,163,0.15)] bg-[#141F24] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#00FFA3] focus:shadow-[0_0_10px_rgba(0,255,163,0.12)] placeholder:text-[#64748B]"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#00FFA3] px-5 py-3 text-xs font-bold text-[#070A0C] shadow-[0_0_12px_rgba(0,255,163,0.25)] transition hover:bg-[#1AFFA8] active:scale-95 min-h-[44px] shrink-0"
            >
              <Send size={13} />
              Yuborish
            </button>
          </form>

          {/* Comments List — isolated component */}
          <div className="mt-4">
            <CommentsList comments={comments} />
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {notice && (
        <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-2xl border border-[rgba(0,255,163,0.35)] bg-[#0F171A]/95 px-5 py-2.5 text-xs font-bold text-[#00FFA3] shadow-[0_0_20px_rgba(0,255,163,0.25)] backdrop-blur-xl">
          {notice}
        </div>
      )}
    </div>
  )
}
