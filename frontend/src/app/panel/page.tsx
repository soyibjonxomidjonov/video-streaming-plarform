'use client';

import React, { useEffect, useState } from 'react';
import { Film, Tv, Users, Tag, MessageSquare, Star } from 'lucide-react';
import { moviesService } from '@/services/movies.service';
import { seriesService } from '@/services/series.service';
import { genresService } from '@/services/genres.service';
import { usersService, commentsService, ratingsService } from '@/services/interactions.service';
import styles from './admin.module.css';

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color, color: '#fff' }}>
        {icon}
      </div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    movies: 0,
    series: 0,
    genres: 0,
    users: 0,
    movieComments: 0,
    movieRatings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [moviesRes, seriesRes, genresRes, usersRes, commentsRes, ratingsRes] = await Promise.allSettled([
          moviesService.getMovies({ page: 1 }),
          seriesService.getSeries({ page: 1 }),
          genresService.getGenres({ page: 1 }),
          usersService.getUsers({ page: 1 }),
          commentsService.getMovieComments({ page: 1 }),
          ratingsService.getMovieRatings({ page: 1 }),
        ]);

        setStats({
          movies: moviesRes.status === 'fulfilled' ? moviesRes.value.count : 0,
          series: seriesRes.status === 'fulfilled' ? seriesRes.value.count : 0,
          genres: genresRes.status === 'fulfilled' ? genresRes.value.count : 0,
          users: usersRes.status === 'fulfilled' ? usersRes.value.count : 0,
          movieComments: commentsRes.status === 'fulfilled' ? commentsRes.value.count : 0,
          movieRatings: ratingsRes.status === 'fulfilled' ? ratingsRes.value.count : 0,
        });
      } catch (err) {
        console.error('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--spacing-6)' }}>
        Umumiy ko&apos;rsatkichlar
      </h2>

      <div className={styles.statsGrid}>
        <StatCard
          icon={<Film size={20} />}
          value={loading ? '...' : stats.movies}
          label="Filmlar"
          color="rgba(108, 99, 255, 0.8)"
        />
        <StatCard
          icon={<Tv size={20} />}
          value={loading ? '...' : stats.series}
          label="Seriallar"
          color="rgba(59, 130, 246, 0.8)"
        />
        <StatCard
          icon={<Tag size={20} />}
          value={loading ? '...' : stats.genres}
          label="Janrlar"
          color="rgba(16, 185, 129, 0.8)"
        />
        <StatCard
          icon={<Users size={20} />}
          value={loading ? '...' : stats.users}
          label="Foydalanuvchilar"
          color="rgba(245, 158, 11, 0.8)"
        />
        <StatCard
          icon={<MessageSquare size={20} />}
          value={loading ? '...' : stats.movieComments}
          label="Film sharhlari"
          color="rgba(236, 72, 153, 0.8)"
        />
        <StatCard
          icon={<Star size={20} />}
          value={loading ? '...' : stats.movieRatings}
          label="Film reytinglari"
          color="rgba(168, 85, 247, 0.8)"
        />
      </div>
    </div>
  );
}
