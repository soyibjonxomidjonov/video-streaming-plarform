'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

// Himoya qilingan yo'llar (login kerak)
const PROTECTED_PATHS = [
  '/profile',
  '/favorites',
  '/watchlist',
  '/movies/', // detail va player
  '/series/',
  '/search',
];

// Bu yo'llar har doim ochiq (login shart emas)
const PUBLIC_PATHS = ['/login', '/register'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Agar foydalanuvchi tizimga kirgan bo'lsa va login/register sahifasida bo'lsa → asosiy sahifaga yo'naltir
    if (isAuthenticated && PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      router.replace('/');
      return;
    }

    // Agar foydalanuvchi kirmagan bo'lsa va himoyalangan sahifada bo'lsa → login ga yo'naltir
    if (!isAuthenticated) {
      const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
      if (isProtected) {
        // returnUrl ni saqlash - login bo'lgandan keyin qaytib kelish uchun
        const returnUrl = encodeURIComponent(pathname);
        router.replace(`/login?next=${returnUrl}`);
      }
    }
  }, [isAuthenticated, pathname, router]);

  return <>{children}</>;
}
