'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/design-system/Button/Button';
import styles from './page.module.css';

type Step = 'email' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  
  // Login qilingandan keyin qaytib borish uchun yo'l
  const nextUrl = searchParams.get('next') || '/';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const redirectAfterLogin = () => {
    // next parametri bor bo'lsa, o'sha yerga yo'naltir
    try {
      const decoded = decodeURIComponent(nextUrl);
      router.push(decoded);
    } catch {
      router.push('/');
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email kiriting'); return; }
    
    setLoading(true);
    setError('');
    try {
      await authService.sendCode(email);
      setMessage('Tasdiqlash kodi emailga yuborildi!');
      setStep('code');
    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) { setError('Kodni kiriting'); return; }
    
    setLoading(true);
    setError('');
    try {
      const res = await authService.verifyCode(email, code);
      login(res.access, res.refresh, { email, first_name: '' });
      redirectAfterLogin();
    } catch (err: any) {
      setError(err?.message || 'Noto\'g\'ri kod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>StreamVibe</div>
        <h1 className={styles.title}>Kirish</h1>
        <p className={styles.subtitle}>
          {step === 'email' 
            ? 'Elektron pochtangizni kiriting' 
            : `${email} ga kod yuborildi`}
        </p>

        {message && <p className={styles.message}>{message}</p>}

        {step === 'email' ? (
          <form className={styles.form} onSubmit={handleSendCode}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" size="lg" fullWidth loading={loading}>
              Kod yuborish
            </Button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleVerifyCode}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="code">Tasdiqlash kodi</label>
              <input
                id="code"
                type="text"
                className={styles.input}
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                autoFocus
                required
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" size="lg" fullWidth loading={loading}>
              Tasdiqlash
            </Button>
            <button 
              type="button"
              onClick={() => { setStep('email'); setError(''); setMessage(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Emailni o&apos;zgartirish
            </button>
          </form>
        )}

        <div className={styles.switchLink}>
          Hisobingiz yo&apos;qmi? <Link href="/register">Ro&apos;yxatdan o&apos;tish</Link>
        </div>
        
        {/* ─── Google orqali kirish ─── */}
        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%', 
            gap: '12px',
            color: 'var(--text-tertiary)',
            fontSize: '0.8rem'
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>yoki</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  const res = await authService.googleLogin(credentialResponse.credential);
                  login(res.access, res.refresh, { 
                    email: res.email || '', 
                    first_name: res.first_name || '' 
                  });
                  redirectAfterLogin();
                } catch (err) {
                  setError('Google orqali kirishda xatolik yuz berdi');
                }
              }
            }}
            onError={() => {
              setError("Google orqali kirish muvaffaqiyatsiz bo'ldi");
            }}
            theme="filled_black"
            shape="pill"
            text="signin_with"
            locale="uz"
          />
        </div>
      </div>
    </div>
  );
}
