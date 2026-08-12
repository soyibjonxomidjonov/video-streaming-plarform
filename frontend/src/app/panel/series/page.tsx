'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { seriesService } from '@/services/series.service';
import { genresService } from '@/services/genres.service';
import { api } from '@/services/api-client';
import { API } from '@/config/env';
import { Button } from '@/components/design-system/Button/Button';
import styles from '../admin.module.css';
import type { Series, Genre } from '@/types';

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Series | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    poster_image: '',
    genres: [] as number[],
  });

  const totalPages = Math.ceil(total / 5);

  const loadSeries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      const res = await seriesService.getSeries(params);
      setSeries(res.results);
      setTotal(res.count);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadSeries(); }, [loadSeries]);
  useEffect(() => {
    genresService.getGenres({ page_size: 100 }).then(res => setGenres(res.results)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingSeries(null);
    setForm({ title: '', description: '', poster_image: '', genres: [] });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (s: Series) => {
    setEditingSeries(s);
    setForm({
      title: s.title,
      description: s.description || '',
      poster_image: s.poster_image || '',
      genres: Array.isArray(s.genres)
        ? s.genres.map((g) => typeof g === 'object' ? g.id : (g as number))
        : [],
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setFormError('Serial nomini kiriting'); return; }
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description, poster_image: form.poster_image || null, genres: form.genres };
      if (editingSeries) {
        await api.patch(API.SERIES_ITEM(editingSeries.id), payload);
      } else {
        await api.post(API.SERIES, payload);
      }
      setShowModal(false);
      loadSeries();
    } catch (err: any) { setFormError(err?.message || 'Xatolik'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(API.SERIES_ITEM(deleteTarget.id));
      setDeleteTarget(null);
      loadSeries();
    } catch (err) { console.error(err); }
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
          <input type="text" className={styles.tableSearch} placeholder="Serial qidirish..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <Button size="sm" onClick={openCreate}><Plus size={16} /> Yangi serial</Button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th><th>Nomi</th><th>Janrlar</th><th>Yaratilgan</th><th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className={styles.emptyTable}>Yuklanmoqda...</td></tr>
              ) : series.length === 0 ? (
                <tr><td colSpan={5} className={styles.emptyTable}>Seriallar topilmadi</td></tr>
              ) : series.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td className={styles.truncate}>{s.title}</td>
                  <td>{Array.isArray(s.genres) ? s.genres.length : 0} ta</td>
                  <td>{new Date(s.created_at).toLocaleDateString('uz-UZ')}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.rowBtn} onClick={() => openEdit(s)}><Pencil size={14} /></button>
                      <button className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => setDeleteTarget(s)}><Trash2 size={14} /></button>
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
              <button className={styles.paginationBtn} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}><ChevronLeft size={16} /></button>
              <span style={{ padding: '0 8px', lineHeight: '32px' }}>{page} / {totalPages}</span>
              <button className={styles.paginationBtn} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingSeries ? 'Serialni tahrirlash' : 'Yangi serial'}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Serial nomi *</label>
                <input className={styles.formInput} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Serial nomi" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tavsif</label>
                <textarea className={styles.formTextarea} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Serial haqida..." />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Poster URL</label>
                <input className={styles.formInput} value={form.poster_image} onChange={e => setForm({...form, poster_image: e.target.value})} placeholder="https://..." />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Janrlar</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                  {genres.map(g => (
                    <button key={g.id} type="button" onClick={() => toggleGenre(g.id)}
                      style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid',
                        borderColor: form.genres.includes(g.id) ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        background: form.genres.includes(g.id) ? 'var(--accent-primary)' : 'transparent',
                        color: form.genres.includes(g.id) ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.8125rem', cursor: 'pointer' }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
            </div>
            <div className={styles.modalFooter}>
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Bekor</Button>
              <Button size="sm" loading={saving} onClick={handleSave}>{editingSeries ? 'Saqlash' : 'Yaratish'}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Serialni o&apos;chirish</h3>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.confirmText}>
                <span className={styles.confirmHighlight}>&quot;{deleteTarget.title}&quot;</span> serialini o&apos;chirmoqchimisiz? Bu amalni ortga qaytarib bo&apos;lmaydi.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Bekor</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>O&apos;chirish</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
