import Link from 'next/link'
import { Star } from 'lucide-react'
import { mediaImage, mediaRating, mediaTitle, mediaYear, type MediaItem } from '@/lib/api'

export default function MediaCard({ item, type }: { item: MediaItem; type: 'movie' | 'series' }) {
  const rating = mediaRating(item)
  const year = mediaYear(item)
  const image = mediaImage(item)
  return (
    <Link
      href={`/watch/${type}/${item.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image || '/placeholder.svg'}
            alt={mediaTitle(item)}
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
            {mediaTitle(item)}
          </div>
        )}
        {rating !== null && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-background/85 px-2 py-1 text-xs font-semibold backdrop-blur">
            <Star size={12} className="fill-primary text-primary" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold">{mediaTitle(item)}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {year ?? 'TBA'} · {type === 'series' ? 'Series' : 'Movie'}
        </p>
      </div>
    </Link>
  )
}
