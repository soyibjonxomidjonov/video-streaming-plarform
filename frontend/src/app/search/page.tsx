'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Film, Tv, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { moviesService } from '@/services/movies.service';
import { seriesService } from '@/services/series.service';
import { genresService } from '@/services/genres.service';
import { ContentCard } from '@/components/content/ContentCard/ContentCard';
import styles from './page.module.css';
import type { Movie, Series, Genre } from '@/types';

type ContentType = 'all' | 'movies' | 'series';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || '';
  const initialSort = searchParams.get('sort') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [query, setQuery] = useState(initialQuery);
  const [contentType, setContentType] = useState<ContentType>('all');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [sortBy, setSortBy] = useState(initialSort);
  const [page, setPage] = useState(initialPage);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load genres once
  useEffect(() => {
    genresService.getGenres({ page_size: 50 }).then(res => {
      setGenres(res.results);
    }).catch(() => {});
  }, []);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      // If genre or sort is selected, we MUST use standard search
      if (selectedGenre || sortBy) {
        const params: Record<string, string | number> = { page };
        if (query) params.search = query;
        if (selectedGenre) params.genre = selectedGenre;
        if (sortBy) params.ordering = sortBy;

        if (contentType === 'movies' || contentType === 'all') {
          const mRes = await moviesService.getMovies(params);
          setMovies(mRes.results);
          setTotalCount(mRes.count);
        }
        
        if (contentType === 'series' || contentType === 'all') {
          const sRes = await seriesService.getSeries(params);
          setSeries(sRes.results);
          if (contentType === 'series') setTotalCount(sRes.count);
          if (contentType === 'all') setTotalCount(prev => prev + sRes.count);
        }

        if (contentType === 'movies') {
          setSeries([]);
        }
        if (contentType === 'series') {
          setMovies([]);
        }
      } else if (query) {
        // Pure text search -> use embedding search!
        const { searchService } = await import('@/services/interactions.service');
        const semanticResults = await searchService.search(query);
        
        let fetchedMovies: Movie[] = [];
        let fetchedSeries: Series[] = [];

        if (contentType === 'movies' || contentType === 'all') {
          const mIds = semanticResults.filter(r => r.content_type === 'movie').map(r => r.object_id);
          // Fetch details to get poster_image
          const mPromises = mIds.map(id => moviesService.getMovieById(id).catch(() => null));
          const mResolved = (await Promise.all(mPromises)).filter(Boolean) as Movie[];
          fetchedMovies = mResolved;
        }

        if (contentType === 'series' || contentType === 'all') {
          const sIds = semanticResults.filter(r => r.content_type === 'series').map(r => r.object_id);
          const sPromises = sIds.map(id => seriesService.getSeriesById(id).catch(() => null));
          const sResolved = (await Promise.all(sPromises)).filter(Boolean) as Series[];
          fetchedSeries = sResolved;
        }

        setMovies(fetchedMovies);
        setSeries(fetchedSeries);
        setTotalCount(fetchedMovies.length + fetchedSeries.length);
      } else {
        // Default empty state -> show all via standard endpoint
        const params: Record<string, string | number> = { page };
        if (contentType === 'movies' || contentType === 'all') {
          const mRes = await moviesService.getMovies(params);
          setMovies(mRes.results);
          setTotalCount(mRes.count);
        }
        if (contentType === 'series' || contentType === 'all') {
          const sRes = await seriesService.getSeries(params);
          setSeries(sRes.results);
          if (contentType === 'series') setTotalCount(sRes.count);
          if (contentType === 'all') setTotalCount(prev => prev + sRes.count);
        }
        if (contentType === 'movies') setSeries([]);
        if (contentType === 'series') setMovies([]);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, contentType, selectedGenre, sortBy, page]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [doSearch]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (sortBy) params.set('sort', sortBy);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [query, selectedGenre, sortBy, page, router]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allResults = [
    ...movies.map(m => ({ ...m, _type: 'movie' as const })),
    ...series.map(s => ({ ...s, _type: 'series' as const })),
  ];

  const pageSize = 5; // matches backend CustomPagination
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className={styles.page}>
      
      {/* ─── Search Header ────── */}
      <div className={styles.searchHeader}>
        <h1 className={styles.searchTitle}>Qidirish</h1>
        <div className={styles.searchBar}>
          <div className={styles.searchInputWrapper}>
            <Search size={20} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Film, serial yoki janr nomi..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              aria-label="Qidirish"
            />
          </div>
        </div>
      </div>

      {/* ─── Filters ────── */}
      <div className="container">
        <div className={styles.filtersBar}>
          {/* Content type */}
          <button
            className={`${styles.filterChip} ${contentType === 'all' ? styles.active : ''}`}
            onClick={() => { setContentType('all'); setPage(1); }}
          >
            Barchasi
          </button>
          <button
            className={`${styles.filterChip} ${contentType === 'movies' ? styles.active : ''}`}
            onClick={() => { setContentType('movies'); setPage(1); }}
          >
            <Film size={14} /> Filmlar
          </button>
          <button
            className={`${styles.filterChip} ${contentType === 'series' ? styles.active : ''}`}
            onClick={() => { setContentType('series'); setPage(1); }}
          >
            <Tv size={14} /> Seriallar
          </button>

          {/* Genre filter */}
          <select
            className={styles.filterSelect}
            value={selectedGenre}
            onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
            aria-label="Janr filtri"
          >
            <option value="">Barcha janrlar</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            aria-label="Saralash"
          >
            <option value="">Standart</option>
            <option value="-created_at">Eng yangi</option>
            <option value="created_at">Eng eski</option>
            <option value="title">Nomi (A-Z)</option>
            <option value="-title">Nomi (Z-A)</option>
            <option value="-duration_seconds">Eng uzun</option>
            <option value="duration_seconds">Eng qisqa</option>
          </select>
        </div>

        {/* ─── Results ────── */}
        {loading ? (
          <div className={styles.resultsGrid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : allResults.length === 0 ? (
          <div className={styles.emptyState}>
            <Search size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>
              {query ? 'Natija topilmadi' : 'Nimani izlayapsiz?'}
            </h3>
            <p className={styles.emptyText}>
              {query
                ? `"${query}" bo'yicha hech narsa topilmadi. Boshqa so'z bilan urinib ko'ring.`
                : 'Film yoki serial nomini yozing yoki janr bo\'yicha filtrlang.'}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.resultsGrid}>
              {allResults.map(item => (
                <ContentCard
                  key={`${item._type}-${item.id}`}
                  id={item.id}
                  title={item.title}
                  posterUrl={item.poster_image}
                  type={item._type}
                  genres={item.genres?.map((g: any) => typeof g === 'string' ? g : g.name)}
                />
              ))}
            </div>

            {/* ─── Pagination ────── */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Oldingi sahifa"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`${styles.pageBtn} ${page === pageNum ? styles.activePage : ''}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  className={styles.pageBtn}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Keyingi sahifa"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className="container" style={{paddingTop: '2rem'}}>Yuklanmoqda...</div></div>}>
      <SearchContent />
    </Suspense>
  );
}
