'use client';

import React, { useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Star, Heart, Share2, Play } from 'lucide-react';
import { seriesService } from '@/services/series.service';
import { favoritesService, commentsService, ratingsService } from '@/services/interactions.service';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { ContentRow } from '@/components/content/ContentRow/ContentRow';
import { Button } from '@/components/design-system/Button/Button';
import { useAuthStore } from '@/store/auth.store';
import styles from './page.module.css';
import type { Series, Episode } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            color: star <= (hover || value) ? '#f59e0b' : 'var(--text-muted)',
          }}
        >
          <Star size={22} fill={star <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function SeriesPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const seriesId = parseInt(unwrappedParams.id, 10);
  const router = useRouter();

  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [episodePage, setEpisodePage] = useState(1);
  const [episodeTotal, setEpisodeTotal] = useState(0);
  const PAGE_SIZE = 10;

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Series[]>([]);

  // Rating
  const [myRating, setMyRating] = useState(0);
  const [myRatingId, setMyRatingId] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (isNaN(seriesId)) { notFound(); return; }

    async function loadData() {
      setLoading(true);
      try {
        const [s, epRes, recsRes, comRes] = await Promise.all([
          seriesService.getSeriesById(seriesId),
          seriesService.getEpisodes(seriesId, { ordering: 'episode_number', page: 1 }),
          seriesService.getSeries({ page: 1 }),
          commentsService.getSeriesComments({ series: seriesId }),
        ]);

        setSeries(s);
        setEpisodes(epRes.results);
        setEpisodeTotal(epRes.count);
        if (epRes.results.length > 0) setActiveEpisode(epRes.results[0]);
        setRecommendations(recsRes.results.filter(r => r.id !== seriesId).slice(0, 10));
        setComments(comRes.results);

        if (isAuthenticated && user) {
          try {
            const favRes = await favoritesService.getSeriesFavorites({ series: seriesId });
            if (favRes.results.length > 0) {
              setIsFavorite(true);
              setFavoriteId(favRes.results[0].id);
            }
          } catch (e) {}
          try {
            const ratingRes = await ratingsService.getSeriesRatings({ series: seriesId });
            if (ratingRes.results.length > 0) {
              setMyRating(ratingRes.results[0].stars);
              setMyRatingId(ratingRes.results[0].id);
            }
          } catch (e) {}
        }
      } catch (err: any) {
        if (err?.status === 404) notFound();
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [seriesId, isAuthenticated, user]);

  // Load more episodes
  const loadMoreEpisodes = async () => {
    const nextPage = episodePage + 1;
    try {
      const res = await seriesService.getEpisodes(seriesId, { ordering: 'episode_number', page: nextPage });
      setEpisodes(prev => [...prev, ...res.results]);
      setEpisodePage(nextPage);
    } catch (err) { console.error(err); }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated || !user) { router.push('/login'); return; }
    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      if (prev && favoriteId) {
        await favoritesService.removeSeriesFavorite(favoriteId);
        setFavoriteId(null);
      } else {
        const res = await favoritesService.addSeriesFavorite(seriesId, (user as any).id ?? 0);
        setFavoriteId(res.id);
      }
    } catch (err) {
      setIsFavorite(prev);
      console.error(err);
    }
  };

  const handleRate = async (stars: number) => {
    if (!isAuthenticated || !user) { router.push('/login'); return; }
    setRatingLoading(true);
    try {
      if (myRatingId) {
        await ratingsService.updateSeriesRating(myRatingId, stars);
      } else {
        const res = await ratingsService.rateSeries(seriesId, (user as any).id ?? 0, stars);
        setMyRatingId(res.id);
      }
      setMyRating(stars);
    } catch (err) { console.error(err); }
    finally { setRatingLoading(false); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) { router.push('/login'); return; }
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const newComment = await commentsService.addSeriesComment(
        seriesId,
        (user as any).id ?? 0,
        commentText.trim()
      );
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (err) { console.error(err); }
    finally { setCommentLoading(false); }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.playerSection}>
          <div style={{ aspectRatio: '16/9', background: 'var(--surface-2)', width: '100%' }} />
        </div>
        <div className={`container ${styles.content}`}>
          {[280, 180, 240].map((w, i) => (
            <div key={i} style={{ height: 24, width: w, background: 'var(--surface-2)', borderRadius: 6, marginBottom: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!series) return null;

  return (
    <div className={styles.page}>

      {/* Video Player */}
      <section className={styles.playerSection}>
        {activeEpisode ? (
          <VideoPlayer
            src={seriesService.getEpisodeStreamUrl(activeEpisode.id)}
            title={`${series.title} — ${activeEpisode.episode_number}-qism`}
            poster={series.poster_image || undefined}
            autoPlay={false}
            contentId={activeEpisode.id}
            contentType="episode"
          />
        ) : (
          <div style={{
            aspectRatio: '16/9', background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: '0.9375rem',
          }}>
            Qismlar topilmadi
          </div>
        )}
      </section>

      <div className={`container ${styles.content}`}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{series.title}</h1>
            <div className={styles.meta}>
              <span>{new Date(series.created_at).getFullYear()}</span>
              {episodes.length > 0 && (
                <>
                  <span className={styles.metaDot} />
                  <span>{episodeTotal} qism</span>
                </>
              )}
              {series.genres && series.genres.length > 0 && (
                <>
                  <span className={styles.metaDot} />
                  <div className={styles.genres}>
                    {series.genres.map(g => (
                      <span key={typeof g === 'object' ? g.id : g} className={styles.genreTag}>
                        {typeof g === 'object' ? g.name : g}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${isFavorite ? styles.active : ''}`}
              onClick={toggleFavorite}
              aria-label="Saqlash"
            >
              <Heart size={22} fill={isFavorite ? 'currentColor' : 'none'} />
              <span>{isFavorite ? 'Saqlangan' : 'Saqlash'}</span>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => navigator.share?.({ title: series.title, url: window.location.href })}
              aria-label="Ulashish"
            >
              <Share2 size={22} />
              <span>Ulashish</span>
            </button>
          </div>
        </div>

        {/* Description */}
        {series.description && (
          <p className={styles.description}>{series.description}</p>
        )}

        {/* Episodes */}
        <section className={styles.episodesSection}>
          <h2 className={styles.episodesTitle}>Barcha qismlar ({episodeTotal})</h2>
          <div className={styles.episodeGrid}>
            {episodes.map(ep => (
              <div
                key={ep.id}
                className={`${styles.episodeCard} ${activeEpisode?.id === ep.id ? styles.active : ''}`}
                onClick={() => setActiveEpisode(ep)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setActiveEpisode(ep)}
              >
                <div className={styles.episodeThumb}>
                  {series.poster_image ? (
                    <img src={series.poster_image} alt={`Qism ${ep.episode_number}`} loading="lazy" />
                  ) : (
                    <div className={styles.episodeFallback}>
                      <Play size={20} />
                    </div>
                  )}
                  {activeEpisode?.id === ep.id && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(108,99,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Play size={24} fill="white" color="white" />
                    </div>
                  )}
                </div>
                <div className={styles.episodeInfo}>
                  <div className={styles.episodeNumber}>{ep.episode_number}-qism</div>
                  <div className={styles.episodeTitle}>
                    {series.title} #{ep.episode_number}
                  </div>
                  {ep.duration_seconds > 0 && (
                    <div className={styles.episodeDuration}>
                      {Math.floor(ep.duration_seconds / 60)} daqiqa
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More Episodes */}
          {episodes.length < episodeTotal && (
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-6)' }}>
              <Button variant="secondary" size="sm" onClick={loadMoreEpisodes}>
                Ko&apos;proq qismlarni ko&apos;rsatish
              </Button>
            </div>
          )}
        </section>

        {/* Rating */}
        <div className={styles.ratingSection}>
          <h2 className={styles.sectionTitle}>Baho bering</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
            <StarRating value={myRating} onChange={handleRate} />
            {ratingLoading && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Saqlanmoqda...</span>}
            {myRating > 0 && !ratingLoading && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Sizning bahoyingiz: {myRating}/5
              </span>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-10)' }}>
            <ContentRow
              title="O'xshash Seriallar"
              items={recommendations.map(s => ({ ...s, type: 'series' as const }))}
            />
          </div>
        )}

        {/* Comments */}
        <section className={styles.commentsSection}>
          <h2 className={styles.commentsTitle}>Sharhlar ({comments.length})</h2>

          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className={styles.commentForm}>
              <textarea
                className={styles.commentInput}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Serial haqida fikringizni yozing..."
                rows={3}
              />
              <Button type="submit" size="sm" loading={commentLoading} disabled={!commentText.trim()}>
                Yuborish
              </Button>
            </form>
          ) : (
            <div className={styles.commentLoginPrompt}>
              Sharh yozish uchun{' '}
              <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>
                tizimga kiring
              </button>
            </div>
          )}

          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Hozircha sharhlar yo&apos;q. Birinchi bo&apos;lib fikr bildiring!
            </p>
          ) : (
            <div className={styles.commentList}>
              {comments.map((c: any) => (
                <div key={c.id} className={styles.commentCard}>
                  <div className={styles.commentAvatar}>U</div>
                  <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>Foydalanuvchi #{c.user}</span>
                      <span className={styles.commentDate}>
                        {new Date(c.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                    <p className={styles.commentText}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
