'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/design-system/Button/Button';
import styles from './page.module.css';

type Step = 'register' | 'code';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [step, setStep] = useState<Step>('register');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [code, setCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName) { setError("Barcha maydonlarni to'ldiring"); return; }
    
    setLoading(true);
    setError('');
    try {
      await authService.register({
        email,
        first_name: firstName,
        last_name: lastName,
        age: age ? parseInt(age, 10) : undefined
      });
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
      login(res.access, res.refresh, { email, first_name: firstName });
      router.push('/');
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
        <h1 className={styles.title}>Ro&apos;yxatdan o&apos;tish</h1>
        <p className={styles.subtitle}>
          {step === 'register' 
            ? 'Yangi hisob yarating' 
            : `${email} ga kod yuborildi`}
        </p>

        {message && <p className={styles.message}>{message}</p>}

        {step === 'register' ? (
          <form className={styles.form} onSubmit={handleRegister}>
            
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="firstName">Ism *</label>
                <input
                  id="firstName"
                  type="text"
                  className={styles.input}
                  placeholder="Ali"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="lastName">Familiya</label>
                <input
                  id="lastName"
                  type="text"
                  className={styles.input}
                  placeholder="Valiyev"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="age">Yosh (ixtiyoriy)</label>
              <input
                id="age"
                type="number"
                className={styles.input}
                placeholder="Masalan: 25"
                value={age}
                onChange={e => setAge(e.target.value)}
                min={1}
                max={120}
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
              Tasdiqlash va kirish
            </Button>
            
            <button 
              type="button"
              onClick={() => { setStep('register'); setError(''); setMessage(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Ma&apos;lumotlarni tahrirlash
            </button>
          </form>
        )}

        <div className={styles.switchLink}>
          Hisobingiz bormi? <Link href="/login">Tizimga kiring</Link>
        </div>
      </div>
    </div>
  );
}
