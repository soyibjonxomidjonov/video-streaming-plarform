import { notFound } from 'next/navigation'
import { api, mediaDescription, mediaImage, mediaTitle, mediaRating, mediaYear, unwrapList, type Comment, type Episode } from '@/lib/api'
import WatchClient from '@/components/watch-client'

export async function generateMetadata({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params
  try {
    const item = type === 'series' ? await api.serie(id) : await api.movie(id)
    return { title: mediaTitle(item), description: mediaDescription(item).slice(0, 160) }
  } catch {
    return { title: 'Watch' }
  }
}

export default async function WatchPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params
  if (type !== 'movie' && type !== 'series') notFound()

  let item
  try {
    item = type === 'series' ? await api.serie(id) : await api.movie(id)
  } catch {
    notFound()
  }
  if (!item) notFound()

  let episodes: Episode[] = []
  if (type === 'series') {
    episodes = item.episodes ?? unwrapList(await api.seriesEpisodes(id).catch(() => []))
  }

  let comments: Comment[] = []
  try {
    comments = unwrapList(type === 'series' ? await api.seriesComments(id) : await api.movieComments(id))
  } catch {
    comments = []
  }

  const firstEpisodeId = episodes[0]?.id
  const streamUrl = type === 'series' && firstEpisodeId ? api.episodeStream(firstEpisodeId) : type === 'movie' ? api.movieStream(id) : ''

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <WatchClient
          id={id}
          type={type}
          title={mediaTitle(item)}
          poster={mediaImage(item, 'backdrop')}
          streamUrl={streamUrl}
          description={mediaDescription(item)}
          rating={mediaRating(item)}
          year={mediaYear(item)}
          episodes={episodes}
          initialComments={comments}
        />
      </div>
    </main>
  )
}
