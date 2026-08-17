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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#070A0C]">
        <Loader2 className="animate-spin text-[#00FFA3]" size={40} aria-hidden="true" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="p-12 text-center bg-[#070A0C] min-h-[100dvh]">
        <h1 className="font-display text-2xl font-bold text-[#F8FAFC]">Film topilmadi</h1>
        <Link href="/movies" className="mt-5 inline-block text-sm font-bold text-[#00FFA3] hover:underline focus-visible:outline-2 focus-visible:outline-[#00FFA3] rounded-sm">
          &larr; Filmlar ro&apos;yxatiga qaytish
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
