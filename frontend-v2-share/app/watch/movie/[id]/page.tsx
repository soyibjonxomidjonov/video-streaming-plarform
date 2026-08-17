'use client'

import React, { useEffect, useState, use } from 'react'
import { api, mediaDescription, mediaImage, mediaRating, mediaTitle, mediaYear, unwrapList, type Comment, type MediaItem } from '@/lib/api'
import WatchClient from '@/components/watch-client'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

export default function WatchMoviePage({ params }: Props) {
  const { id } = use(params)
  const [movie, setMovie] = useState<MediaItem | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [mRes, cRes] = await Promise.allSettled([
          api.movie(id),
          api.movieComments(id),
        ])
        if (!active) return
        if (mRes.status === 'fulfilled') setMovie(mRes.value)
        if (cRes.status === 'fulfilled') setComments(unwrapList(cRes.value))
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080a0a]">
        <Loader2 className="animate-spin text-[#00e599]" size={40} />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="p-12 text-center bg-[#080a0a] min-h-screen">
        <h1 className="text-xl font-bold text-[#f5f7f6]">Film topilmadi</h1>
        <Link href="/movies" className="mt-4 inline-block text-xs font-bold text-[#00e599]">
          ← Filmlar ro&apos;yxatiga qaytish
        </Link>
      </div>
    )
  }

  const streamUrl = api.movieStream(id)

  return (
    <WatchClient
      id={id}
      type="movie"
      title={mediaTitle(movie)}
      poster={mediaImage(movie, 'backdrop')}
      streamUrl={streamUrl}
      description={mediaDescription(movie)}
      rating={mediaRating(movie)}
      year={mediaYear(movie)}
      initialComments={comments}
    />
  )
}
