'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Play, User } from 'lucide-react'
import { api, ApiError, setToken, setRefreshToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import GoogleSignInButton from '@/components/google-sign-in-button'

export default function RegisterForm({ googleClientId }: { googleClientId: string }) {
  const router = useRouter()
  const { refresh } = useAuth()
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.register({
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        age: age ? Number(age) : undefined,
      })
      setStep('code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ro\'yxatdan o\'tilmadi. Qaytadan urining.')
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
      setError(err instanceof ApiError && err.status === 400 ? 'Noto\'g\'ri kod.' : 'Xatolik yuz berdi.')
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
          <h1 className="font-display text-2xl font-black tracking-tight">S-M</h1>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'rgba(22, 22, 26, 0.95)',
            border: '1px solid #2a2a30',
            backdropFilter: 'blur(20px)',
          }}
        >
          {step === 'form' ? (
            <>
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl" style={{ background: 'rgba(245,166,35,0.12)' }}>
                <User size={20} style={{ color: '#f5a623' }} />
              </div>
              <h2 className="font-display text-xl font-bold">Ro&apos;yxatdan o&apos;tish</h2>
              <p className="mt-1 text-sm text-muted-foreground">Akkaunt yarating</p>

              <div className="mt-5 mb-2 min-h-11">
                <GoogleSignInButton clientId={googleClientId} onError={setError} />
              </div>

              <div className="mt-6 mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">yoki</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form id="register-form" onSubmit={sendCode} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="first-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">Ism</label>
                    <input
                      id="first-name"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Ali"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">Familiya</label>
                    <input
                      id="last-name"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Valiyev"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-email" className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    id="register-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="sizning@email.com"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="age" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Yosh <span className="text-muted-foreground/60">(ixtiyoriy)</span>
                  </label>
                  <input
                    id="age"
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="25"
                    min={10}
                    max={100}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: '#0a0a0c', border: '1px solid #2a2a30' }}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="rounded-xl px-4 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </p>
                )}

                <button
                  id="register-submit"
                  type="submit"
                  disabled={loading || !email.trim() || !firstName.trim()}
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
                >
                  {loading ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  ) : (
                    <>Kod yuborish <ArrowRight size={15} /></>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Akkauntingiz bormi?{' '}
                <Link href="/login" className="font-semibold" style={{ color: '#f5a623' }}>
                  Kirish
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold">Emailni tasdiqlang</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <span style={{ color: '#f5a623' }}>{email}</span> manziliga kod yuborildi
              </p>

              <form id="register-verify-form" onSubmit={verifyCode} className="mt-5 flex flex-col gap-4">
                <input
                  id="register-code-input"
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
                />

                {error && (
                  <p className="rounded-xl px-4 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </p>
                )}

                <button
                  id="register-verify-btn"
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
                >
                  {loading ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  ) : (
                    'Tasdiqlash'
                  )}
                </button>
              </form>

              <button
                onClick={() => { setStep('form'); setCode(''); setError('') }}
                className="mt-4 w-full text-center text-sm text-muted-foreground transition hover:text-foreground"
              >
                ← Orqaga
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
