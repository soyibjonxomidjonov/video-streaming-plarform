'use client';

import React, { useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Star, Heart, Share2, AlertCircle, Play, ChevronRight } from 'lucide-react';
import { moviesService } from '@/services/movies.service';
import { commentsService, favoritesService, ratingsService } from '@/services/interactions.service';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { ContentRow } from '@/components/content/ContentRow/ContentRow';
import { Button } from '@/components/design-system/Button/Button';
import { useAuthStore } from '@/store/auth.store';
import styles from './page.module.css';
import type { Movie, MovieComment } from '@/types';

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
          <Star size={24} fill={star <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function MoviePage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const movieId = parseInt(unwrappedParams.id, 10);
  const router = useRouter();

  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [comments, setComments] = useState<MovieComment[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);

  // Rating
  const [myRating, setMyRating] = useState(0);
  const [myRatingId, setMyRatingId] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Comment form
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (isNaN(movieId)) { notFound(); return; }

    async function loadData() {
      setLoading(true);
      try {
        const [m, recs, comRes] = await Promise.all([
          moviesService.getMovieById(movieId),
          moviesService.getMovies({ page: 1 }),
          commentsService.getMovieComments({ movie: movieId }),
        ]);
        setMovie(m);
        setRecommendations(recs.results.filter(r => r.id !== movieId).slice(0, 10));
        setComments(comRes.results);

        if (isAuthenticated && user) {
          // Check favorites
          try {
            const favRes = await favoritesService.getMovieFavorites({ movie: movieId });
            if (favRes.results.length > 0) {
              setIsFavorite(true);
              setFavoriteId(favRes.results[0].id);
            }
          } catch (e) { /* not critical */ }
          // Check my rating
          try {
            const ratingRes = await ratingsService.getMovieRatings({ movie: movieId });
            if (ratingRes.results.length > 0) {
              setMyRating(ratingRes.results[0].stars);
              setMyRatingId(ratingRes.results[0].id);
            }
          } catch (e) { /* not critical */ }
        }
      } catch (err: any) {
        if (err?.status === 404) notFound();
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [movieId, isAuthenticated, user]);

  const toggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      if (prev && favoriteId) {
        await favoritesService.removeMovieFavorite(favoriteId);
        setFavoriteId(null);
      } else {
        const res = await favoritesService.addMovieFavorite(movieId, (user as any).id ?? 0);
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
        await ratingsService.updateMovieRating(myRatingId, stars);
      } else {
        const res = await ratingsService.rateMovie(movieId, (user as any).id ?? 0, stars);
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
      const newComment = await commentsService.addMovieComment(
        movieId,
        (user as any).id ?? 0,
        commentText.trim()
      );
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (err) { console.error(err); }
    finally { setCommentLoading(false); }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: movie?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
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

  if (!movie) return null;

  return (
    <div className={styles.page}>
      {/* Player */}
      <section className={styles.playerSection}>
        <VideoPlayer
          src={moviesService.getStreamUrl(movie.id)}
          title={movie.title}
          poster={movie.poster_image || undefined}
          autoPlay={false}
          contentId={movie.id}
          contentType="movie"
        />
      </section>

      <div className={`container ${styles.content}`}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{movie.title}</h1>
            <div className={styles.meta}>
              <span>{new Date(movie.created_at).getFullYear()}</span>
              {movie.duration_seconds > 0 && (
                <>
                  <span className={styles.metaDot} />
                  <span>{Math.floor(movie.duration_seconds / 60)} daqiqa</span>
                </>
              )}
              {movie.genres && movie.genres.length > 0 && (
                <>
                  <span className={styles.metaDot} />
                  <div className={styles.genres}>
                    {movie.genres.map(g => (
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
            <button className={styles.actionBtn} onClick={handleShare} aria-label="Ulashish">
              <Share2 size={22} />
              <span>Ulashish</span>
            </button>
          </div>
        </div>

        {/* Description */}
        {movie.description && (
          <p className={styles.description}>{movie.description}</p>
        )}

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
              title="O'xshash Filmlar"
              items={recommendations.map(m => ({ ...m, type: 'movie' as const }))}
            />
          </div>
        )}

        {/* Comments */}
        <section className={styles.commentsSection}>
          <h2 className={styles.commentsTitle}>Sharhlar ({comments.length})</h2>

          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className={styles.commentForm}>
              <textarea
                className={styles.commentInput}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Fikringizni yozing..."
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

          {/* Comment List */}
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Hozircha sharhlar yo&apos;q. Birinchi bo&apos;lib fikr bildiring!
            </p>
          ) : (
            <div className={styles.commentList}>
              {comments.map(c => (
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
