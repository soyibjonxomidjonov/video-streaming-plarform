'use client';

import React from 'react';
import Link from 'next/link';
import styles from './ContentCard.module.css';
import { Star } from 'lucide-react';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

interface ContentCardProps {
  id: number;
  title: string;
  posterUrl?: string | null;
  type: 'movie' | 'series';
  durationSeconds?: number;
  rating?: number;
  genres?: string[];
  badge?: string;
  /** 0-1 progress for "Continue Watching" */
  progress?: number;
  landscape?: boolean;
}

export function ContentCard({
  id,
  title,
  posterUrl,
  type,
  durationSeconds,
  rating,
  genres,
  badge,
  progress,
  landscape = false,
}: ContentCardProps) {
  const href = type === 'movie' ? `/movies/${id}` : `/series/${id}`;

  return (
    <Link href={href} className={landscape ? styles.landscape : styles.card}>
      <div className={styles.poster}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={styles.posterFallback}>
            {title.charAt(0)}
          </div>
        )}
        <div className={styles.posterOverlay} />

        {badge && <span className={styles.badge}>{badge}</span>}

        {durationSeconds && (
          <span className={styles.duration}>{formatDuration(durationSeconds)}</span>
        )}

        {typeof progress === 'number' && progress > 0 && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.meta}>
          {rating != null && rating > 0 && (
            <>
              <span className={styles.rating}>
                <Star size={12} fill="currentColor" />
                {rating.toFixed(1)}
              </span>
              <span className={styles.metaDot} />
            </>
          )}
          {genres && genres.length > 0 && (
            <span>{genres.slice(0, 2).join(', ')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
