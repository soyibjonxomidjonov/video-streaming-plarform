'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Info } from 'lucide-react';
import { moviesService } from '@/services/movies.service';
import { seriesService } from '@/services/series.service';
import { ContentRow } from '@/components/content/ContentRow/ContentRow';
import { Button } from '@/components/design-system/Button/Button';
import styles from './page.module.css';
import type { Movie, Series } from '@/types';

export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [newMovies, setNewMovies] = useState<any[]>([]);
  const [popularSeries, setPopularSeries] = useState<any[]>([]);
  const [actionMovies, setActionMovies] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [moviesRes, seriesRes] = await Promise.all([
          moviesService.getMovies({ limit: 20 }),
          seriesService.getSeries({ limit: 10 }),
        ]);

        const m = moviesRes.results;
        const s = seriesRes.results;

        if (m.length > 0) {
          // Select a random movie with a high rating for the hero
          const candidates = m.filter(x => x.poster_image);
          const hero = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : m[0];
          setHeroMovie(hero);
        }

        // Mock categorizations based on fetched data for display purposes
        setTrendingMovies(m.slice(0, 10));
        setNewMovies(m.slice(10, 20).reverse());
        setPopularSeries(s);
        setActionMovies(m.filter(x => {
          if (!x.genres) return false;
          if (Array.isArray(x.genres)) {
            return x.genres.some((g: any) => 
              (typeof g === 'object' && g?.name?.toLowerCase().includes('action')) ||
              (typeof g === 'string' && (g.toLowerCase().includes('jangari') || g.toLowerCase().includes('action')))
            );
          }
          return false;
        }));
        
      } catch (err) {
        console.error("Home page data error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className={styles.page}>
      
      {/* ─── Hero Section ────── */}
      <section className={styles.hero}>
        {heroMovie?.poster_image && (
          <img 
            src={heroMovie.poster_image} 
            alt={heroMovie.title} 
            className={`${styles.heroPoster} ${styles.active}`}
          />
        )}
        <div className={styles.heroGradient} />
        
        <div className={styles.heroContent}>
          <div className="container">
            {loading ? (
              <div style={{ maxWidth: 600 }}>
                <div style={{ height: 24, width: 100, background: 'var(--surface-2)', borderRadius: 4, marginBottom: 16 }} />
                <div style={{ height: 64, width: '100%', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 24 }} />
                <div style={{ height: 48, width: 250, background: 'var(--surface-2)', borderRadius: 8 }} />
              </div>
            ) : heroMovie ? (
              <>
                <div className={styles.heroMeta}>
                  <span className={styles.heroBadge}>Tavsiya Qilamiz</span>
                  <span>{new Date(heroMovie.created_at).getFullYear()}</span>
                </div>
                
                <h1 className={styles.heroTitle}>{heroMovie.title}</h1>
                
                <p className={styles.heroDescription}>
                  {heroMovie.description || "Ushbu ajoyib asarni tomosha qiling. Bu film sizga eng yaxshi hissiyotlarni taqdim etadi va bo'sh vaqtingizni unumli o'tkazishingizga yordam beradi."}
                </p>
                
                <div className={styles.heroActions}>
                  <Button 
                    size="xl" 
                    onClick={() => router.push(`/movies/${heroMovie.id}`)}
                  >
                    <Play size={20} fill="currentColor" />
                    Tomosha qilish
                  </Button>
                  <Button 
                    size="xl" 
                    variant="secondary"
                    onClick={() => router.push(`/movies/${heroMovie.id}`)}
                  >
                    <Info size={20} />
                    Batafsil
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* ─── Main Content (Rows) ────── */}
      <main className={styles.main}>
        
        <ContentRow 
          title="Top Trending" 
          items={trendingMovies.map(m => ({ ...m, type: 'movie' }))} 
          loading={loading}
          seeAllHref="/movies?sort=trending"
        />
        
        <ContentRow 
          title="Yangi Filmlar" 
          items={newMovies.map(m => ({ ...m, type: 'movie' }))} 
          loading={loading}
          seeAllHref="/movies?sort=new"
        />
        
        <ContentRow 
          title="Mashhur Seriallar" 
          items={popularSeries.map(s => ({ ...s, type: 'series' }))} 
          loading={loading}
          seeAllHref="/series?sort=popular"
        />
        
        {actionMovies.length > 0 && (
          <ContentRow 
            title="Jangari" 
            items={actionMovies.map(m => ({ ...m, type: 'movie' }))} 
            loading={loading}
            seeAllHref="/movies?genre=action"
          />
        )}
        
      </main>
      
    </div>
  );
}
