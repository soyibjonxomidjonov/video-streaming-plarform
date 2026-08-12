'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { moviesService } from '@/services/movies.service';
import { genresService } from '@/services/genres.service';
import { api } from '@/services/api-client';
import { API } from '@/config/env';
import { Button } from '@/components/design-system/Button/Button';
import styles from '../admin.module.css';
import type { Movie, Genre, PaginatedResponse } from '@/types';

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form
  const [form, setForm] = useState({
    title: '',
    description: '',
    poster_image: '',
    telegram_channel: '',
    telegram_message_id: '',
    telegram_file_id: '',
    duration_seconds: '',
    genres: [] as number[],
  });

  const pageSize = 5;
  const totalPages = Math.ceil(total / pageSize);

  const loadMovies = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      const res = await moviesService.getMovies(params);
      setMovies(res.results);
      setTotal(res.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadMovies(); }, [loadMovies]);

  useEffect(() => {
    genresService.getGenres({ page_size: 100 }).then(res => setGenres(res.results)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingMovie(null);
    setForm({ title: '', description: '', poster_image: '', telegram_channel: '', telegram_message_id: '', telegram_file_id: '', duration_seconds: '', genres: [] });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setForm({
      title: movie.title,
      description: movie.description || '',
      poster_image: movie.poster_image || '',
      telegram_channel: movie.telegram_channel || '',
      telegram_message_id: String(movie.telegram_message_id || ''),
      telegram_file_id: movie.telegram_file_id || '',
      duration_seconds: String(movie.duration_seconds || ''),
      genres: Array.isArray(movie.genres)
        ? movie.genres.map((g) => typeof g === 'object' ? g.id : g)
        : [],
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setFormError('Film nomini kiriting'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        poster_image: form.poster_image || null,
        telegram_channel: form.telegram_channel,
        telegram_message_id: form.telegram_message_id ? parseInt(form.telegram_message_id) : 0,
        telegram_file_id: form.telegram_file_id,
        duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : 0,
        genres: form.genres,
      };

      if (editingMovie) {
        await api.patch(API.MOVIE(editingMovie.id), payload);
      } else {
        await api.post(API.MOVIES, payload);
      }
      setShowModal(false);
      loadMovies();
    } catch (err: any) {
      setFormError(err?.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(API.MOVIE(deleteTarget.id));
      setDeleteTarget(null);
      loadMovies();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGenre = (id: number) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(id) ? prev.genres.filter(g => g !== id) : [...prev.genres, id]
    }));
  };

  return (
    <div>
      <div className={styles.tableContainer}>
        <div className={styles.tableToolbar}>
          <input
            type="text"
            className={styles.tableSearch}
            placeholder="Film qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> Yangi film
          </Button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nomi</th>
                <th>Davomiyligi</th>
                <th>Telegram</th>
                <th>Keshda</th>
                <th>Yaratilgan</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className={styles.emptyTable}>Yuklanmoqda...</td></tr>
              ) : movies.length === 0 ? (
                <tr><td colSpan={7} className={styles.emptyTable}>Filmlar topilmadi</td></tr>
              ) : movies.map(movie => (
                <tr key={movie.id}>
                  <td>{movie.id}</td>
                  <td className={styles.truncate}>{movie.title}</td>
                  <td>{movie.duration_seconds ? `${Math.floor(movie.duration_seconds / 60)} daq` : '-'}</td>
                  <td className={styles.truncate}>{movie.telegram_channel || '-'}</td>
                  <td>{movie.is_cashed ? '✓' : '✗'}</td>
                  <td>{new Date(movie.created_at).toLocaleDateString('uz-UZ')}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.rowBtn} onClick={() => openEdit(movie)} title="Tahrirlash">
                        <Pencil size={14} />
                      </button>
                      <button className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => setDeleteTarget(movie)} title="O'chirish">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.tablePagination}>
            <span>Jami: {total}</span>
            <div className={styles.paginationBtns}>
              <button className={styles.paginationBtn} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ padding: '0 8px', lineHeight: '32px' }}>{page} / {totalPages}</span>
              <button className={styles.paginationBtn} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create/Edit Modal ────── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingMovie ? 'Filmni tahrirlash' : 'Yangi film qo\'shish'}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Film nomi *</label>
                <input className={styles.formInput} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Film nomi" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tavsif</label>
                <textarea className={styles.formTextarea} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Film haqida..." />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Poster URL</label>
                <input className={styles.formInput} value={form.poster_image} onChange={e => setForm({...form, poster_image: e.target.value})} placeholder="https://..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Telegram kanal</label>
                  <input className={styles.formInput} value={form.telegram_channel} onChange={e => setForm({...form, telegram_channel: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Message ID</label>
                  <input className={styles.formInput} type="number" value={form.telegram_message_id} onChange={e => setForm({...form, telegram_message_id: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>File ID</label>
                  <input className={styles.formInput} value={form.telegram_file_id} onChange={e => setForm({...form, telegram_file_id: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Davomiylik (soniya)</label>
                  <input className={styles.formInput} type="number" value={form.duration_seconds} onChange={e => setForm({...form, duration_seconds: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Janrlar</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                  {genres.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGenre(g.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid',
                        borderColor: form.genres.includes(g.id) ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        background: form.genres.includes(g.id) ? 'var(--accent-primary)' : 'transparent',
                        color: form.genres.includes(g.id) ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                      }}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
            </div>
            <div className={styles.modalFooter}>
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Bekor qilish</Button>
              <Button size="sm" loading={saving} onClick={handleSave}>
                {editingMovie ? 'Saqlash' : 'Yaratish'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ────── */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Filmni o&apos;chirish</h3>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.confirmText}>
                <span className={styles.confirmHighlight}>&quot;{deleteTarget.title}&quot;</span> filmini o&apos;chirmoqchimisiz?
                Bu amalni ortga qaytarib bo&apos;lmaydi.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Bekor qilish</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>O&apos;chirish</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
