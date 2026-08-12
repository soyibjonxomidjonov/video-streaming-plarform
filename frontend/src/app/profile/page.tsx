'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Heart, Clock, Film, Tv } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/design-system/Button/Button';
import { ContentCard } from '@/components/content/ContentCard/ContentCard';
import { favoritesService, watchProgressService } from '@/services/interactions.service';
import styles from './page.module.css';

type Tab = 'favorites' | 'history';

// Normalized item that ContentCard can render
interface FavItem {
  id: number;
  title: string;
  poster_image: string | null;
  _type: 'movie' | 'series';
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('favorites');
  const [items, setItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    async function loadData() {
      setLoading(true);
      try {
        if (activeTab === 'favorites') {
          const [mRes, sRes] = await Promise.all([
            favoritesService.getMovieFavorites(),
            favoritesService.getSeriesFavorites(),
          ]);
          const combined: FavItem[] = [
            ...mRes.results.map((f: any) => ({
              id: f.movie_detail?.id ?? f.movie,
              title: f.movie_detail?.title ?? `Film #${f.movie}`,
              poster_image: f.movie_detail?.poster_image ?? null,
              _type: 'movie' as const,
            })),
            ...sRes.results.map((f: any) => ({
              id: f.series_detail?.id ?? f.series,
              title: f.series_detail?.title ?? `Serial #${f.series}`,
              poster_image: f.series_detail?.poster_image ?? null,
              _type: 'series' as const,
            })),
          ];
          setItems(combined);
        } else {
          // Watch history — combine movie + episode progress
          const [mProg, eProg] = await Promise.all([
            watchProgressService.getMovieProgress(),
            watchProgressService.getEpisodeProgress(),
          ]);
          const histItems: FavItem[] = [
            ...mProg.results.map((p: any) => ({
              id: p.movie_detail?.id ?? p.movie,
              title: p.movie_detail?.title ?? `Film #${p.movie}`,
              poster_image: p.movie_detail?.poster_image ?? null,
              _type: 'movie' as const,
            })),
            ...eProg.results.map((p: any) => ({
              id: p.episode_detail?.series ?? p.episode,
              title: p.episode_detail?.title ?? `Qism #${p.episode}`,
              poster_image: null,
              _type: 'series' as const,
            })),
          ];
          setItems(histItems);
        }
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, isAuthenticated, activeTab]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated || !user) return null;

  const initials =
    user.first_name?.[0]?.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    'U';

  return (
    <div className={styles.page}>

      {/* ─── Profile Header ────── */}
      <div className={styles.header}>
        <div className={`container ${styles.profileInfo}`}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.details}>
            <h1 className={styles.name}>{user.first_name || 'Foydalanuvchi'}</h1>
            <p className={styles.email}>{user.email}</p>
            <div className={styles.actions}>
              <Button variant="secondary" size="sm">
                <Settings size={16} /> Sozlamalar
              </Button>
              <Button variant="danger" size="sm" onClick={handleLogout}>
                <LogOut size={16} /> Chiqish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`container ${styles.content}`}>

        {/* ─── Tabs ────── */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'favorites' ? styles.active : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={16} />
            Saqlanganlar
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} />
            Ko&apos;rish tarixi
          </button>
        </div>

        {/* ─── Content ────── */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '2/3',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-lg)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            {activeTab === 'favorites' ? (
              <>
                <Heart size={48} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 16 }} />
                <h3>Saqlangan filmlar yo&apos;q</h3>
                <p>Yoqtirgan filmlaringizni saqlash uchun ♥ tugmasini bosing</p>
                <Button size="sm" onClick={() => router.push('/')} style={{ marginTop: 16 }}>
                  Filmlarni ko&apos;rish
                </Button>
              </>
            ) : (
              <>
                <Clock size={48} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 16 }} />
                <h3>Ko&apos;rish tarixi bo&apos;sh</h3>
                <p>Tomosha qilgan filmlaringiz bu yerda ko&apos;rinadi</p>
                <Button size="sm" onClick={() => router.push('/')} style={{ marginTop: 16 }}>
                  Filmlarni ko&apos;rish
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map(item => (
              <ContentCard
                key={`${item._type}-${item.id}`}
                id={item.id}
                title={item.title}
                posterUrl={item.poster_image}
                type={item._type}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
