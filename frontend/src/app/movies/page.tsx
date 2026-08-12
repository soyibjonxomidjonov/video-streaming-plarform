'use client';
import React, { useEffect, useState } from 'react';
import { moviesService } from '@/services/movies.service';
import { ContentRow } from '@/components/content/ContentRow/ContentRow';
import styles from '../page.module.css';

export default function MoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moviesService.getMovies().then(res => {
      setMovies(res.results.map(m => ({ ...m, type: 'movie' })));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ paddingTop: 100 }}>
        <h1>Barcha Filmlar</h1>
        <ContentRow title="" items={movies} loading={loading} />
      </main>
    </div>
  );
}
