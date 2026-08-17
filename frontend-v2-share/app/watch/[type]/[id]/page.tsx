'use client'

import React, { useEffect, useState, use } from 'react'
import { api, mediaDescription, mediaImage, mediaTitle, mediaRating, mediaYear, unwrapList, type Comment, type Episode, type MediaItem } from '@/lib/api'
import WatchClient from '@/components/watch-client'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function WatchPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = use(params)
  const [item, setItem] = useState<MediaItem | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const isSeries = type === 'series'
        const [mRes, cRes, epRes] = await Promise.allSettled([
          isSeries ? api.serie(id) : api.movie(id),
          isSeries ? api.seriesComments(id) : api.movieComments(id),
          isSeries ? api.seriesEpisodes(id) : Promise.resolve([]),
        ])
        if (!active) return
        if (mRes.status === 'fulfilled') {
          const m = mRes.value
          setItem(m)
          if (m.episodes) setEpisodes(m.episodes)
        }
        if (cRes.status === 'fulfilled') {
          setComments(unwrapList(cRes.value))
        }
        if (epRes.status === 'fulfilled' && epRes.value) {
          const epList = unwrapList(epRes.value) as Episode[]
          if (epList.length > 0) setEpisodes(epList)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [type, id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080a0a]">
        <Loader2 className="animate-spin text-[#00e599]" size={40} />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="p-12 text-center bg-[#080a0a] min-h-screen">
        <h1 className="text-xl font-bold text-[#f5f7f6]">Kontent topilmadi</h1>
        <Link href="/" className="mt-4 inline-block text-xs font-bold text-[#00e599]">
          ← Bosh sahifaga qaytish
        </Link>
      </div>
    )
  }

  const firstEpisodeId = episodes[0]?.id
  const streamUrl = type === 'series' && firstEpisodeId ? api.episodeStream(firstEpisodeId) : type === 'movie' ? api.movieStream(id) : ''

  return (
    <WatchClient
      id={id}
      type={type as 'movie' | 'series'}
      title={mediaTitle(item)}
      poster={mediaImage(item, 'backdrop')}
      streamUrl={streamUrl}
      description={mediaDescription(item)}
      rating={mediaRating(item)}
      year={mediaYear(item)}
      episodes={episodes}
      initialComments={comments}
    />
  )
}
