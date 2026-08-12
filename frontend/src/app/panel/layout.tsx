'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Film, Tv, Users, Tag, MessageSquare,
  Star, Heart, Clock, Menu, X, LogOut, ArrowLeft, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import styles from './admin.module.css';

const NAV_GROUPS = [
  {
    title: 'Asosiy',
    items: [
      { href: '/panel', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Kontent',
    items: [
      { href: '/panel/movies', label: 'Filmlar', icon: Film },
      { href: '/panel/series', label: 'Seriallar', icon: Tv },
      { href: '/panel/genres', label: 'Janrlar', icon: Tag },
    ],
  },
  {
    title: 'Foydalanuvchilar',
    items: [
      { href: '/panel/users', label: 'Foydalanuvchilar', icon: Users },
      { href: '/panel/comments', label: 'Sharhlar', icon: MessageSquare },
      { href: '/panel/ratings', label: 'Reytinglar', icon: Star },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Simple client-side guard (real security is backend IsStaffOrReadOnly)
  // In production, check user.is_staff
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16 }}>Admin panelga kirish uchun tizimga kiring.</p>
          <Link href="/login" style={{ color: 'var(--accent-primary)' }}>Kirish sahifasiga o&apos;tish</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      <div 
        className={`${styles.overlay} ${sidebarOpen ? styles.visible : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>StreamVibe</span>
          <span className={styles.sidebarBadge}>Admin</span>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_GROUPS.map(group => (
            <div key={group.title} className={styles.navGroup}>
              <div className={styles.navGroupTitle}>{group.title}</div>
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/panel' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.navItem}>
            <ArrowLeft size={18} />
            Saytga qaytish
          </Link>
          <button className={styles.navItem} onClick={() => { logout(); router.push('/'); }}>
            <LogOut size={18} />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className={styles.pageTitle}>
            {NAV_GROUPS.flatMap(g => g.items).find(i => 
              pathname === i.href || (i.href !== '/panel' && pathname.startsWith(i.href))
            )?.label || 'Admin'}
          </span>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {user?.email}
          </div>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
