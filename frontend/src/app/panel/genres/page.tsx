'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { genresService } from '@/services/genres.service';
import { api } from '@/services/api-client';
import { API } from '@/config/env';
import { Button } from '@/components/design-system/Button/Button';
import styles from '../admin.module.css';
import type { Genre } from '@/types';

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Genre | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '' });

  const totalPages = Math.ceil(total / 5);

  const loadGenres = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      const res = await genresService.getGenres(params);
      setGenres(res.results);
      setTotal(res.count);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadGenres(); }, [loadGenres]);

  const openCreate = () => {
    setEditingGenre(null);
    setForm({ name: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (g: Genre) => {
    setEditingGenre(g);
    setForm({ name: g.name });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Janr nomini kiriting'); return; }
    setSaving(true);
    try {
      if (editingGenre) {
        await api.patch(API.GENRE(editingGenre.id), { name: form.name });
      } else {
        await api.post(API.GENRES, { name: form.name });
      }
      setShowModal(false);
      loadGenres();
    } catch (err: any) { setFormError(err?.message || 'Xatolik'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(API.GENRE(deleteTarget.id));
      setDeleteTarget(null);
      loadGenres();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className={styles.tableContainer}>
        <div className={styles.tableToolbar}>
          <input type="text" className={styles.tableSearch} placeholder="Janr qidirish..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <Button size="sm" onClick={openCreate}><Plus size={16} /> Yangi janr</Button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr><th>ID</th><th>Janr nomi</th><th style={{ width: 100 }}>Amallar</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className={styles.emptyTable}>Yuklanmoqda...</td></tr>
              ) : genres.length === 0 ? (
                <tr><td colSpan={3} className={styles.emptyTable}>Janrlar topilmadi</td></tr>
              ) : genres.map(g => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td>{g.name}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.rowBtn} onClick={() => openEdit(g)}><Pencil size={14} /></button>
                      <button className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => setDeleteTarget(g)}><Trash2 size={14} /></button>
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
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingGenre ? 'Janrni tahrirlash' : 'Yangi janr'}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Janr nomi *</label>
                <input className={styles.formInput} value={form.name} onChange={e => setForm({name: e.target.value})} autoFocus />
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
            </div>
            <div className={styles.modalFooter}>
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Bekor</Button>
              <Button size="sm" loading={saving} onClick={handleSave}>{editingGenre ? 'Saqlash' : 'Yaratish'}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Janrni o&apos;chirish</h3>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.confirmText}>
                <span className={styles.confirmHighlight}>&quot;{deleteTarget.name}&quot;</span> janrini o&apos;chirmoqchimisiz?
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
