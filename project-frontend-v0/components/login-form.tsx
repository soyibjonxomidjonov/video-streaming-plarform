'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Mail, Play, Shield } from 'lucide-react'
import { api, ApiError, setToken, setRefreshToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import GoogleSignInButton from '@/components/google-sign-in-button'

export default function LoginForm({ googleClientId }: { googleClientId: string }) {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      await api.login(trimmed)
      setStep('code')
      setInfo(`${trimmed} manziliga 6 xonali kod yuborildi`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi. Qaytadan urining.')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault()
    if (code.length < 6) return
    setLoading(true)
    setError('')
    try {
      const result = await api.verifyCode(email.trim().toLowerCase(), code)
      setToken(result.access)
      setRefreshToken(result.refresh)
      await refresh()
      router.replace('/')
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError('Noto\'g\'ri kod. Tekshirib qaytadan kiriting.')
      } else {
        setError('Xatolik yuz berdi. Qaytadan urining.')
      }
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    setLoading(true)
    setError('')
    try {
      await api.login(email.trim().toLowerCase())
      setInfo('Yangi kod yuborildi.')
    } catch {
      setError('Kodni qayta yuborib bo\'lmadi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: '#0a0a0c' }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,166,35,0.07) 0%, transparent 70%)' }}
        aria-hidden
      />

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/">
            <div
              className="flex size-14 items-center justify-center rounded-2xl shadow-xl transition hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
            >
              <Play size={24} fill="#0a0a0c" className="translate-x-0.5" />
            </div>
          </Link>
          <div className="text-center">
            <h1 className="font-display text-2xl font-black tracking-tight">S-M</h1>
            <p className="mt-1 text-sm text-muted-foreground">Video striming platforma</p>
          </div>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'rgba(22, 22, 26, 0.95)',
            border: '1px solid #2a2a30',
            backdropFilter: 'blur(20px)',
          }}
        >
          {step === 'email' ? (
            <>
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl" style={{ background: 'rgba(245,166,35,0.12)' }}>
                <Mail size={20} style={{ color: '#f5a623' }} />
              </div>
              <h2 className="font-display text-xl font-bold">Tizimga kirish</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Emailingizga tasdiqlash kodi yuboriladi
              </p>

              <div className="mt-5 mb-2 min-h-11">
                <GoogleSignInButton clientId={googleClientId} onError={setError} />
              </div>

              <div className="mt-6 mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">yoki</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form id="login-email-form" onSubmit={sendCode} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="email-input" className="mb-1.5 block text-sm font-medium">Email</label>
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                    style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
                  >
                    <Mail size={15} className="text-muted-foreground" />
                    <input
                      id="email-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="sizning@email.com"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      style={{ border: 'none' }}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl px-4 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </p>
                )}

                <button
                  id="send-code-btn"
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
                >
                  {loading ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  ) : (
                    <>Kodni yuborish <ArrowRight size={15} /></>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Akkauntingiz yo&apos;qmi?{' '}
                <Link href="/register" className="font-semibold" style={{ color: '#f5a623' }}>
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl" style={{ background: 'rgba(245,166,35,0.12)' }}>
                <Shield size={20} style={{ color: '#f5a623' }} />
              </div>
              <h2 className="font-display text-xl font-bold">Kodni tasdiqlang</h2>
              {info && (
                <p className="mt-1 text-sm text-muted-foreground">{info}</p>
              )}

              <form id="verify-form" onSubmit={verifyCode} className="mt-5 flex flex-col gap-4">
                <div>
                  <label htmlFor="code-input" className="mb-1.5 block text-sm font-medium">Tasdiqlash kodi</label>
                  <input
                    id="code-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    value={code}
                    onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                    placeholder="000000"
                    className="w-full rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none"
                    style={{ background: '#0a0a0c', border: `1px solid ${code.length === 6 ? '#f5a623' : '#2a2a30'}` }}
                    maxLength={6}
                    required
                    disabled={loading}
                  />
                  <p className="mt-2 text-center text-xs text-muted-foreground">{email}</p>
                </div>

                {error && (
                  <p className="rounded-xl px-4 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </p>
                )}

                <button
                  id="verify-code-btn"
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
                >
                  {loading ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  ) : (
                    'Tasdiqlash va kirish'
                  )}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  onClick={() => { setStep('email'); setCode(''); setError('') }}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  ← Orqaga
                </button>
                <button
                  id="resend-code-btn"
                  onClick={resendCode}
                  disabled={loading}
                  className="font-semibold transition hover:opacity-80 disabled:opacity-40"
                  style={{ color: '#f5a623' }}
                >
                  Qayta yuborish
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
