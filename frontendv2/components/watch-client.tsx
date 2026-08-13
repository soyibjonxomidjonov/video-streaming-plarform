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

  const requireAuth = () => {
    if (!isAuthenticated) {
      setNotice('Please sign in to use this feature.')
      return false
    }
    return true
  }

  const toggleFavorite = () => {
    if (!requireAuth()) return
    setFavorite(value => !value)
    const task = type === 'movie' ? api.favoriteMovie(Number(id)) : api.favoriteSeries(Number(id))
    task.catch(() => {
      setFavorite(value => !value)
      setNotice('Could not update favorites.')
    })
  }

  const submitRating = (value: number) => {
    if (!requireAuth()) return
    setRated(value)
    const task = type === 'movie' ? api.rateMovie(Number(id), value) : api.rateSeries(Number(id), value)
    task.catch(() => setNotice('Could not save rating.'))
  }

  const postComment = async (text: string) => {
    if (!requireAuth() || !text.trim()) return
    const trimmed = text.trim()
    try {
      const created = type === 'movie' ? await api.commentMovie(Number(id), trimmed) : await api.commentSeries(Number(id), trimmed)
      setComments(prev => [created ?? { id: Date.now(), text: trimmed }, ...prev])
    } catch (err) {
      setNotice(err instanceof ApiError ? 'Could not post comment.' : 'Network error.')
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
    <div className="flex flex-col gap-8">
      <Link href="/explore" className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft size={16} /> Back to explore
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="relative aspect-video bg-black">
              {currentStream ? (
                <video
                  key={currentStream}
                  ref={videoRef}
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
                <div className="flex size-full items-center justify-center text-sm text-muted-foreground">No stream available</div>
              )}
              {loading && !error && currentStream && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                  <LoaderCircle className="animate-spin text-primary" size={36} />
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 text-center">
                  <AlertCircle className="text-accent" />
                  <p className="font-semibold">Video is temporarily unavailable</p>
                  <button
                    onClick={() => {
                      setError(false)
                      setLoading(true)
                      videoRef.current?.load()
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-7">
              <div className="flex items-center gap-2 border-b border-border pb-4 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-primary" /> Voice control this player from the assistant orb on the right
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[.18em] text-primary">{type === 'series' ? 'Series' : 'Movie'}</p>
                  <h1 className="mt-2 font-display text-2xl font-bold text-balance sm:text-3xl">{title}</h1>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {year && <span>{year}</span>}
                    {rating !== null && (
                      <span className="flex items-center gap-1">
                        <Star size={13} className="fill-primary text-primary" /> {rating.toFixed(1)}
                      </span>
                    )}
                    {type === 'series' && activeEpisode && <span>Now playing: {mediaTitle(activeEpisode)}</span>}
                  </p>
                </div>
                <button
                  onClick={toggleFavorite}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${favorite ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-secondary'}`}
                >
                  <Heart size={16} className={favorite ? 'fill-accent' : ''} /> {favorite ? 'Saved' : 'Save'}
                </button>
              </div>

              {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}

              <div className="flex items-center gap-1">
                <span className="mr-2 text-sm text-muted-foreground">Rate:</span>
                {[1, 2, 3, 4, 5].map(value => (
                  <button key={value} onClick={() => submitRating(value)} aria-label={`Rate ${value} stars`}>
                    <Star size={20} className={value <= rated ? 'fill-primary text-primary' : 'text-muted-foreground'} />
                  </button>
                ))}
              </div>

              {notice && <p className="text-sm text-accent">{notice}</p>}
            </div>
          </div>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="font-display text-xl font-bold">Comments</h2>
            <form onSubmit={submitComment} className="mt-4 flex gap-2">
              <input
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder={isAuthenticated ? 'Add a comment...' : 'Sign in to comment'}
                className="min-h-11 flex-1 rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground" aria-label="Post comment">
                <Send size={16} />
              </button>
            </form>
            <ul className="mt-6 flex flex-col gap-4">
              {comments.length === 0 ? (
                <li className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts.</li>
              ) : (
                comments.map(item => (
                  <li key={item.id} className="rounded-xl bg-secondary p-4">
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
            <h2 className="px-1 font-display text-lg font-bold">Episodes</h2>
            <ul className="mt-3 flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
              {episodes.map((episode, index) => {
                const active = episode.id === activeEpisode?.id
                return (
                  <li key={episode.id}>
                    <button
                      onClick={() => selectEpisode(episode)}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-muted'}`}
                    >
                      <span className={`text-sm font-bold ${active ? '' : 'text-muted-foreground'}`}>{episode.episode_number ?? index + 1}</span>
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
