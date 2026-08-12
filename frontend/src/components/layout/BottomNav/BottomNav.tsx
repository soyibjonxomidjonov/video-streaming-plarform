'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Search, User } from 'lucide-react';
import styles from './BottomNav.module.css';

const ITEMS = [
  { icon: Home, label: 'Bosh sahifa', href: '/' },
  { icon: Search, label: 'Qidirish', href: '/search' },
  { icon: Film, label: 'Filmlar', href: '/movies' },
  { icon: Tv, label: 'Seriallar', href: '/series' },
  { icon: User, label: 'Profil', href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  // Admin panelda ko'rsatilmasin
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className={styles.bottomNav} aria-label="Mobil navigatsiya">
      {ITEMS.map(({ icon: Icon, label, href }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
