'use client';

import React from 'react';
import Link from 'next/link';
import styles from './ContentRow.module.css';
import { ContentCard } from '../ContentCard/ContentCard';

interface ContentItem {
  id: number;
  title: string;
  poster_image?: string | null;
  type: 'movie' | 'series';
  duration_seconds?: number;
  rating?: number;
  genres?: Array<string | { id: number; name: string }>;
  progress?: number;
}

interface ContentRowProps {
  title: string;
  seeAllHref?: string;
  items: ContentItem[];
  loading?: boolean;
  landscape?: boolean;
  emptyMessage?: string;
}

function SkeletonRow({ count, landscape }: { count: number; landscape: boolean }) {
  return (
    <div className={styles.scrollContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={landscape ? styles.itemLandscape : styles.item}>
          <div className={landscape ? styles.skeletonLandscape : styles.skeletonPoster} />
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonMeta} />
        </div>
      ))}
    </div>
  );
}

export function ContentRow({
  title,
  seeAllHref,
  items,
  loading = false,
  landscape = false,
  emptyMessage,
}: ContentRowProps) {
  // Don't render empty rows unless loading
  if (!loading && items.length === 0 && !emptyMessage) return null;

  return (
    <section className={styles.row}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className={styles.seeAll}>
            Hammasini ko&#39;rish
          </Link>
        )}
      </div>

      {loading ? (
        <SkeletonRow count={6} landscape={landscape} />
      ) : items.length === 0 ? (
        <p style={{
          padding: '0 var(--spacing-4)',
          color: 'var(--text-muted)',
          fontSize: '0.875rem'
        }}>
          {emptyMessage || 'Hozircha kontent mavjud emas'}
        </p>
      ) : (
        <div className={styles.scrollContainer}>
          {items.map((item) => (
            <div key={item.id} className={landscape ? styles.itemLandscape : styles.item}>
              <ContentCard
                id={item.id}
                title={item.title}
                posterUrl={item.poster_image}
                type={item.type}
                durationSeconds={item.duration_seconds}
                rating={item.rating}
                genres={item.genres?.map(g => typeof g === 'string' ? g : g.name)}
                progress={item.progress}
                landscape={landscape}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
