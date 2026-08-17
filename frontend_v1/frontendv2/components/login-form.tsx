'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Mail, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { api, ApiError, setToken, setRefreshToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import GoogleSignInButton from '@/components/google-sign-in-button'
import { Logo, LogoFull } from '@/components/ui/logo'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export default function LoginForm({ googleClientId }: { googleClientId?: string }) {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)

  const emailError =
    emailTouched && email && !isValidEmail(email)
      ? "To'g'ri email manzil kiriting"
      : ''

  const activeClientId =
    googleClientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '106374320593-u4o15ahs5g3t798kvl6c4e6vte9lnn5s.apps.googleusercontent.com'

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !isValidEmail(trimmed)) {
      setEmailTouched(true)
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.login(trimmed)
      setStep('code')
      setInfo(`${trimmed} manziliga 6 xonali tasdiqlash kodi yuborildi`)
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
        setError("Noto'g'ri tasdiqlash kodi. Tekshirib qaytadan kiriting.")
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
      setInfo('Yangi kod emailingizga yuborildi.')
    } catch {
      setError("Kodni qayta yuborib bo'lmadi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: '#060B0A',
      padding: '40px 16px',
    }}>

      {/* ── Top green ambient glow ── */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(0,200,130,0.18) 0%, transparent 65%)',
        }}
      />
      {/* ── Bottom-right faint glow ── */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 50% 40% at 90% 100%, rgba(0,120,80,0.08) 0%, transparent 55%)',
        }}
      />

      {/* ── Content ── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: 'clamp(360px, 90vw, 490px)',
      }}>

        {/* ── Brand ── */}
        <div className="mb-6 sm:mb-8 flex flex-col items-center gap-3">
          <Link href="/" aria-label="Bosh sahifaga qaytish">
            <Logo className="size-[54px] sm:size-[62px]" />
          </Link>
          <div className="text-center">
            <h1 className="text-[1.65rem] sm:text-[1.85rem] font-black tracking-tight">
              <span className="text-white">SM</span>{' '}
              <span className="text-[#00E599]">STREAM</span>
            </h1>
            <p className="mt-1 text-[12.5px] sm:text-[13.5px] text-[#4A5E58]">
              Video striming va AI ovozli platforma
            </p>
          </div>
        </div>

        {/* ── Card ── */}
        <div
          className="overflow-hidden p-6 sm:p-9 md:p-10"
          style={{
            width: '100%',
            borderRadius: '28px',
            background: 'rgba(10, 17, 15, 0.92)',
            border: '1px solid rgba(0,200,130,0.12)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(0,200,130,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {step === 'email' ? (
            <div>
              {/* Step header */}
              <div className="mb-5">
                <div
                  className="mb-4 flex size-11 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(0,200,130,0.15)',
                    border: '1px solid rgba(0,200,130,0.25)',
                  }}
                >
                  <Mail size={20} className="text-[#00E599]" aria-hidden="true" />
                </div>
                <h2 className="text-[1.3rem] font-bold text-white">Tizimga kirish</h2>
                <p className="mt-1 text-[13px] text-[#4A6158]">
                  Emailingizga 6 xonali tasdiqlash kodi yuboriladi
                </p>
              </div>

              {/* Google button */}
              <div className="mb-1">
                <GoogleSignInButton clientId={activeClientId} onError={setError} />
              </div>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <div className="h-px flex-1" style={{ background: 'rgba(0,200,130,0.1)' }} />
                <span className="text-[11px] text-[#3A5048]">yoki email orqali</span>
                <div className="h-px flex-1" style={{ background: 'rgba(0,200,130,0.1)' }} />
              </div>

              {/* Email form */}
              <form id="login-email-form" onSubmit={sendCode} className="flex flex-col gap-4" noValidate>
                <div>
                  <label
                    htmlFor="email-input"
                    className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#6B7F79]"
                  >
                    Email manzili
                  </label>

                  {/* Input field — matches reference image */}
                  <div
                    className="flex items-center gap-3 px-4 transition-all duration-200"
                    style={{
                      minHeight: '54px',
                      borderRadius: '10px',
                      background: 'rgba(8, 16, 13, 0.9)',
                      border: emailError
                        ? '2px solid rgba(239,68,68,0.6)'
                        : '2px solid rgba(0,220,140,0.45)',
                    }}
                  >
                    <Mail
                      size={15}
                      className="shrink-0"
                      style={{
                        color: emailError ? '#EF4444' : '#2E4D42',
                      }}
                      aria-hidden="true"
                    />
                    <input
                      id="email-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError('')
                        if (!emailTouched) setEmailTouched(true)
                      }}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="sizning@email.com"
                      aria-label="Email manzil"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? 'email-error' : undefined}
                      className="w-full min-w-0 text-[14px] text-[#D8EDE6] placeholder:text-[#233830]"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        borderRadius: 0,
                      }}
                      required
                      disabled={loading}
                    />
                    {emailTouched && email && (
                      isValidEmail(email)
                        ? <CheckCircle2 size={14} className="shrink-0 text-[#00E599]" aria-hidden="true" />
                        : <AlertCircle size={14} className="shrink-0 text-[#EF4444]" aria-hidden="true" />
                    )}
                  </div>

                  {emailError && (
                    <p id="email-error" role="alert" className="mt-2 flex items-center gap-1.5 text-[11px] text-[#EF4444]">
                      <AlertCircle size={11} aria-hidden="true" />
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Server error */}
                {error && (
                  <p
                    id="login-server-error"
                    role="alert"
                    className="rounded-xl px-4 py-2.5 text-[12px] font-medium text-[#EF4444]"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    {error}
                  </p>
                )}

                {/* Submit button */}
                <button
                  id="send-code-btn"
                  type="submit"
                  disabled={loading || !email.trim() || !!emailError}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold text-[#061008] transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #00E599 0%, #00C87A 100%)',
                    boxShadow: !loading && email.trim() && !emailError
                      ? '0 4px 20px rgba(0,229,153,0.4)'
                      : 'none',
                  }}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" aria-label="Yuklanmoqda" />
                  ) : (
                    <>
                      <span>Kodni yuborish</span>
                      <ArrowRight size={17} aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-[12px] text-[#354D46]">
                Akkauntingiz yo&apos;qmi?{' '}
                <Link
                  href="/register"
                  className="font-bold text-[#00E599] transition-opacity hover:opacity-80"
                >
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </p>
            </div>

          ) : (
            /* ── STEP 2: CODE ── */
            <div>
              <div className="mb-5">
                <div
                  className="mb-4 flex size-11 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(0,200,130,0.15)',
                    border: '1px solid rgba(0,200,130,0.25)',
                  }}
                >
                  <KeyRound size={20} className="text-[#00E599]" aria-hidden="true" />
                </div>
                <h2 className="text-[1.3rem] font-bold text-white">Kodni tasdiqlash</h2>
                <p className="mt-1 text-[13px] text-[#4A6158]" aria-live="polite">
                  {info}
                </p>
              </div>

              <form id="login-code-form" onSubmit={verifyCode} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="code-input"
                    className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: '#00C882' }}
                  >
                    6 xonali tasdiqlash kodi
                  </label>

                  <input
                    id="code-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ''))
                      setError('')
                    }}
                    placeholder="· · · · · ·"
                    aria-label="6 xonali tasdiqlash kodi"
                    disabled={loading}
                    required
                    className="w-full min-w-0 rounded-2xl border border-[rgba(0,200,130,0.22)] bg-[rgba(6,12,10,0.7)] px-5 py-4 text-center font-mono text-[1.9rem] font-black tracking-[0.45em] text-[#00E599] outline-none transition-all duration-200 placeholder:text-[#1A2E26] placeholder:tracking-[0.3em] placeholder:text-[1.4rem] focus:border-[rgba(0,200,130,0.6)] focus:shadow-[0_0_18px_rgba(0,200,130,0.12)]"
                    style={{ minHeight: '68px' }}
                  />

                  {/* Progress dots */}
                  <div className="mt-3 flex justify-center gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[3px] w-7 rounded-full transition-all duration-200"
                        style={{
                          background: i < code.length ? '#00E599' : 'rgba(0,200,130,0.1)',
                          boxShadow: i < code.length ? '0 0 6px rgba(0,229,153,0.6)' : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl px-4 py-2.5 text-[12px] font-medium text-[#EF4444]"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    {error}
                  </p>
                )}

                <button
                  id="verify-code-btn"
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold text-[#061008] transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #00E599 0%, #00C87A 100%)',
                    boxShadow: !loading && code.length >= 6
                      ? '0 4px 20px rgba(0,229,153,0.4)'
                      : 'none',
                  }}
                >
                  {loading
                    ? <Loader2 size={18} className="animate-spin" />
                    : 'Tasdiqlash va Kirish'}
                </button>

                <div className="flex items-center justify-between text-[12px]">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setCode(''); setError('') }}
                    className="min-h-[40px] px-1 text-[#354D46] transition-colors hover:text-[#A0BEB5]"
                  >
                    ← Emailni o&apos;zgartirish
                  </button>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={loading}
                    className="min-h-[40px] px-1 font-bold text-[#00E599] transition-opacity hover:opacity-75 disabled:opacity-40"
                  >
                    Qayta yuborish
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
