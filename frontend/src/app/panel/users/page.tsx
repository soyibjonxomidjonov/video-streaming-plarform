'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usersService } from '@/services/interactions.service';
import { api } from '@/services/api-client';
import { API } from '@/config/env';
import styles from '../admin.module.css';

interface UserData {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  auth_provider: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = Math.ceil(total / 5);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      // This endpoint is IsSuperuserOrReadOnly
      const res = await usersService.getUsers(params);
      setUsers(res.results);
      setTotal(res.count);
    } catch (err: any) {
      setError(err?.message || 'Users load error. Check superuser status.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleStatus = async (user: UserData, field: 'is_active' | 'is_staff') => {
    try {
      await api.patch(API.USER(user.id), { [field]: !user[field] });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className={styles.tableContainer}>
        <div className={styles.tableToolbar}>
          <input type="text" className={styles.tableSearch} placeholder="Foydalanuvchi qidirish..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Ism / Familiya</th>
                <th>Yosh</th>
                <th>Provider</th>
                <th>Faol</th>
                <th>Admin (Staff)</th>
                <th>Ro&apos;yxatdan o&apos;tgan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className={styles.emptyTable}>Yuklanmoqda...</td></tr>
              ) : error ? (
                <tr><td colSpan={8} className={styles.emptyTable} style={{ color: 'var(--color-error)' }}>{error}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className={styles.emptyTable}>Foydalanuvchilar topilmadi</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.first_name || '-'} {u.last_name || ''}</td>
                  <td>{u.age || '-'}</td>
                  <td><span className={styles.sidebarBadge} style={{ margin: 0 }}>{u.auth_provider}</span></td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(u, 'is_active')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: u.is_active ? 'var(--color-success)' : 'var(--text-muted)' }}
                    >
                      {u.is_active ? 'Ha' : 'Yo\'q'}
                    </button>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(u, 'is_staff')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: u.is_staff ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                    >
                      {u.is_staff ? 'Admin' : 'Oddiy'}
                    </button>
                  </td>
                  <td>{new Date(u.date_joined).toLocaleDateString('uz-UZ')}</td>
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
    </div>
  );
}
