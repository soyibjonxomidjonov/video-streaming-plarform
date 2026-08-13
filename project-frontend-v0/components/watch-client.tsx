'use client'

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Heart, LoaderCircle, Send, Star } from 'lucide-react'
import { api, ApiError, commentAuthor, commentText, mediaTitle, type Comment, type Episode } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'

type Props = {
  id: string
  type: 'movie' | 'series'
  title: string
  poster: string
  streamUrl: string
  description: string
  rating: number | null
  year: number | string | null
  episodes: Episode[]
  initialComments: Comment[]
}

export default function WatchClient({ id, type, title, poster, streamUrl, description, rating, year, episodes, initialComments }: Props) {
  const { isAuthenticated } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(episodes[0] ?? null)
  const [currentStream, setCurrentStream] = useState(streamUrl)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState<number | null>(null)
  const [rated, setRated] = useState(0)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [notice, setNotice] = useState('')

  const targetId = type === 'series' ? activeEpisode?.id : Number(id)

  const saveProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || !targetId) return
    const task = type === 'movie' ? api.progressMovie(Number(id), video.currentTime) : api.progressEpisode(targetId, video.currentTime)
    task.catch(() => undefined)
  }, [id, type, targetId])

  useEffect(() => {
    const interval = setInterval(saveProgress, 15000)
    return () => {
      clearInterval(interval)
      saveProgress()
    }
  }, [saveProgress])

  const selectEpisode = (episode: Episode) => {
    saveProgress()
    setActiveEpisode(episode)
    setCurrentStream(api.episodeStream(episode.id))
    setError(false)
    setLoading(true)
  }

  const playNext = () => {
    if (type !== 'series' || !activeEpisode) return
    const index = episodes.findIndex(ep => ep.id === activeEpisode.id)
    const next = episodes[index + 1]
    if (next) selectEpisode(next)
  }

  const playPrevious = () => {
    if (type !== 'series' || !activeEpisode) return
    const index = episodes.findIndex(ep => ep.id === activeEpisode.id)
    const previous = episodes[index - 1]
    if (previous) selectEpisode(previous)
  }

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
        const res = type === 'movie' ? await api.favoriteMovie(Number(id)) : await api.favoriteSeries(Number(id))
        setFavorite(true)
        setFavoriteId(res.id)
        showNotice('Sevimlilarga qo\'shildi ⭐')
      }
    } catch {
      showNotice('Sevimlilarga saqlanmadi.')
    }
  }

  const submitRating = async (value: number) => {
    if (!isAuthenticated) { showNotice('Iltimos, avval tizimga kiring.'); return }
    setRated(value)
    try {
      if (type === 'movie') await api.rateMovie(Number(id), value)
      else await api.rateSeries(Number(id), value)
      showNotice(`${value} yulduz baho saqlandi`)
    } catch {
      showNotice('Baho saqlanmadi.')
    }
  }

  const postComment = async (text: string) => {
    if (!isAuthenticated) { showNotice('Iltimos, avval tizimga kiring.'); return }
    const trimmed = text.trim()
    if (!trimmed) return
    try {
      const created = type === 'movie' ? await api.commentMovie(Number(id), trimmed) : await api.commentSeries(Number(id), trimmed)
      setComments(prev => [created ?? { id: Date.now(), text: trimmed }, ...prev])
      showNotice('Izoh qoldirildi ✓')
    } catch (err) {
      showNotice(err instanceof ApiError ? err.message : 'Izoh yuborilmadi.')
    }
  }

  const submitComment = async (event: FormEvent) => {
    event.preventDefault()
    if (!comment.trim()) return
    const text = comment.trim()
    setComment('')
    await postComment(text)
  }

  const { registerPlayer, unregisterPlayer } = useVoiceAssistant()

  useEffect(() => {
    registerPlayer({
      videoRef,
      contentType: type,
      contentId: String(activeEpisode?.id ?? id),
      contentTitle: title,
      hasNextEpisode: () => {
        if (type !== 'series' || !activeEpisode) return false
        return episodes.findIndex(ep => ep.id === activeEpisode.id) < episodes.length - 1
      },
      hasPreviousEpisode: () => {
        if (type !== 'series' || !activeEpisode) return false
        return episodes.findIndex(ep => ep.id === activeEpisode.id) > 0
      },
      nextEpisode: playNext,
      previousEpisode: playPrevious,
      toggleFavorite,
      rate: submitRating,
      addComment: postComment,
    })
    return unregisterPlayer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEpisode?.id, title])

  return (
    <div className="flex flex-col gap-6">
      <Link href={type === 'series' ? `/series/${id}` : `/movie/${id}`} className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft size={16} /> Batafsil sahifaga qaytish
      </Link>

      <div className="grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="relative aspect-video bg-black">
              {currentStream ? (
                <video
                  key={currentStream}
                  ref={videoRef}
                  data-role="main-player"
                  controls
                  playsInline
                  preload="metadata"
                  poster={poster || undefined}
                  src={currentStream}
                  className="size-full"
                  onLoadStart={() => setLoading(true)}
                  onCanPlay={() => setLoading(false)}
                  onWaiting={() => setLoading(true)}
                  onPlaying={() => setLoading(false)}
                  onPause={saveProgress}
                  onEnded={playNext}
                  onError={() => {
                    setLoading(false)
                    setError(true)
                  }}
                />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-muted-foreground">Video oqimi mavjud emas</div>
              )}
              {loading && !error && currentStream && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                  <LoaderCircle className="animate-spin text-primary" size={40} style={{ color: '#f5a623' }} />
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 text-center p-4">
                  <AlertCircle size={32} style={{ color: '#f5a623' }} />
                  <p className="font-semibold text-foreground">Video vaqtincha mavjud emas</p>
                  <p className="text-xs text-muted-foreground max-w-sm">Server javob bermayapti yoki tarmoq uzildi. Qayta urinib ko&apos;ring.</p>
                  <button
                    onClick={() => {
                      setError(false)
                      setLoading(true)
                      videoRef.current?.load()
                    }}
                    className="rounded-xl px-5 py-2.5 text-xs font-bold text-black transition hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
                  >
                    Qayta yuklash
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-7">
              <div className="flex items-center gap-2 border-b border-border pb-4 text-xs text-muted-foreground">
                <span className="size-2 rounded-full animate-pulse" style={{ background: '#f5a623' }} /> Ovozli yordamchi orqali ushbu pleerni boshqarishingiz mumkin (&quot;pauza&quot;, &quot;oldinga 10 soniya&quot;)
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#f5a623' }}>{type === 'series' ? 'Serial' : 'Film'}</p>
                  <h1 className="mt-1.5 font-display text-2xl font-bold text-balance sm:text-3xl">{title}</h1>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {year && <span>{year}</span>}
                    {rating !== null && (
                      <span className="flex items-center gap-1 font-semibold" style={{ color: '#f5a623' }}>
                        <Star size={13} style={{ fill: '#f5a623' }} /> {rating.toFixed(1)}
                      </span>
                    )}
                    {type === 'series' && activeEpisode && <span className="text-foreground">Ijro etilmoqda: {mediaTitle(activeEpisode)}</span>}
                  </p>
                </div>
                <button
                  onClick={toggleFavorite}
                  className="flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition active:scale-95"
                  style={
                    favorite
                      ? { background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.3)' }
                      : { background: '#16161a', border: '1px solid #2a2a30', color: '#9a9aa2' }
                  }
                >
                  <Heart size={16} className={favorite ? 'fill-current' : ''} /> {favorite ? 'Saqlangan' : 'Saqlash'}
                </button>
              </div>

              {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Baho bering:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button key={value} onClick={() => submitRating(value)} aria-label={`${value} yulduz`}>
                      <Star size={20} style={{ fill: value <= rated ? '#f5a623' : 'transparent', color: value <= rated ? '#f5a623' : '#3a3a42' }} />
                    </button>
                  ))}
                </div>
              </div>

              {notice && <p className="text-sm font-medium" style={{ color: '#22c55e' }}>{notice}</p>}
            </div>
          </div>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="font-display text-xl font-bold">Izohlar</h2>
            <form onSubmit={submitComment} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder={isAuthenticated ? 'Izoh yozing...' : 'Izoh qoldirish uchun tizimga kiring'}
                disabled={!isAuthenticated}
                className="min-h-11 flex-1 rounded-xl bg-surface px-4 text-sm outline-none border border-border"
              />
              <button
                type="submit"
                disabled={!isAuthenticated || !comment.trim()}
                className="flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
                aria-label="Izoh yuborish"
              >
                <Send size={16} />
              </button>
            </form>
            <ul className="mt-6 flex flex-col gap-3">
              {comments.length === 0 ? (
                <li className="text-sm text-muted-foreground">Hali izohlar yo&apos;q. Birinchi bo&apos;lib o&apos;z fikringizni bildiring!</li>
              ) : (
                comments.map(item => (
                  <li key={item.id} className="rounded-xl p-4" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
                    <p className="text-sm font-semibold">{commentAuthor(item)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{commentText(item)}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        {type === 'series' && episodes.length > 0 && (
          <aside className="rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-6 lg:h-fit">
            <h2 className="px-1 font-display text-lg font-bold">Epizodlar ({episodes.length})</h2>
            <ul className="mt-3 flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
              {episodes.map((episode, index) => {
                const active = episode.id === activeEpisode?.id
                return (
                  <li key={episode.id}>
                    <button
                      onClick={() => selectEpisode(episode)}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition"
                      style={
                        active
                          ? { background: '#f5a623', color: '#0a0a0c', fontWeight: 'bold' }
                          : { background: '#16161a', border: '1px solid #2a2a30', color: '#f4f4f5' }
                      }
                    >
                      <span className={`text-sm font-bold ${active ? 'text-black' : 'text-muted-foreground'}`}>{episode.episode_number ?? index + 1}</span>
                      <span className="truncate text-sm font-medium">{mediaTitle(episode)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
        )}
      </div>
    </div>
  )
}
