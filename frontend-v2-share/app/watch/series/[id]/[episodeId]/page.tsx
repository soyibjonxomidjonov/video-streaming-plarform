'use client'

import React, { useEffect, useState, use } from 'react'
import { api, mediaDescription, mediaImage, mediaRating, mediaTitle, mediaYear, unwrapList, type Comment, type Episode, type MediaItem } from '@/lib/api'
import WatchClient from '@/components/watch-client'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

type Props = { params: Promise<{ id: string; episodeId: string }> }

export default function WatchSeriesEpisodePage({ params }: Props) {
  const { id, episodeId } = use(params)
  const [series, setSeries] = useState<MediaItem | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [sRes, epRes, cRes] = await Promise.allSettled([
          api.serie(id),
          api.seriesEpisodes(id),
          api.seriesComments(id),
        ])
        if (!active) return
        if (sRes.status === 'fulfilled') {
          const item = sRes.value
          setSeries(item)
          if (item.episodes) setEpisodes(item.episodes)
        }
        if (epRes.status === 'fulfilled' && epRes.value) {
          const epList = unwrapList(epRes.value) as Episode[]
          if (epList.length > 0) setEpisodes(epList)
        }
        if (cRes.status === 'fulfilled') {
          setComments(unwrapList(cRes.value))
        }
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

  if (!series) {
    return (
      <div className="p-12 text-center bg-[#080a0a] min-h-screen">
        <h1 className="text-xl font-bold text-[#f5f7f6]">Serial topilmadi</h1>
        <Link href="/series" className="mt-4 inline-block text-xs font-bold text-[#00e599]">
          ← Seriallar ro&apos;yxatiga qaytish
        </Link>
      </div>
    )
  }

  const activeEp = episodes.find(e => String(e.id) === String(episodeId)) || episodes[0]
  const streamUrl = activeEp ? api.episodeStream(activeEp.id) : api.episodeStream(episodeId)

  return (
    <WatchClient
      id={id}
      type="series"
      title={mediaTitle(series)}
      poster={mediaImage(series, 'backdrop')}
      streamUrl={streamUrl}
      description={mediaDescription(series)}
      rating={mediaRating(series)}
      year={mediaYear(series)}
      episodes={episodes}
      initialComments={comments}
    />
  )
}
