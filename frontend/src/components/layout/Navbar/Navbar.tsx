'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Mic, User } from 'lucide-react';
import styles from './Navbar.module.css';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { label: 'Bosh sahifa', href: '/' },
  { label: 'Filmlar', href: '/movies' },
  { label: 'Seriallar', href: '/series' },
  { label: 'Janrlar', href: '/genres' },
];

interface NavbarProps {
  onVoiceClick?: () => void;
}

export function Navbar({ onVoiceClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.solid : styles.transparent}`}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            StreamVibe
          </Link>

          <ul className={styles.navLinks}>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.right}>
          <Link href="/search" className={styles.searchButton} aria-label="Qidirish">
            <Search size={20} />
          </Link>

          <button
            className={styles.voiceButton}
            onClick={onVoiceClick}
            aria-label="Ovozli boshqaruv"
          >
            <Mic size={20} />
          </button>

          {isAuthenticated ? (
            <Link href="/profile" className={styles.profileButton} aria-label="Profil">
              <div className={styles.profileAvatar}>
                {user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </Link>
          ) : (
            <Link href="/login" className={styles.profileButton} aria-label="Kirish">
              <User size={20} />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
