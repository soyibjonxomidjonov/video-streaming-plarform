'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Mail, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { api, ApiError, setToken, setRefreshToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import GoogleSignInButton from '@/components/google-sign-in-button'
import { Logo } from '@/components/ui/logo'

export default function LoginForm({ googleClientId }: { googleClientId?: string }) {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const activeClientId =
    googleClientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '106374320593-u4o15ahs5g3t798kvl6c4e6vte9lnn5s.apps.googleusercontent.com'

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070A0C] p-4">

      {/* ── Ambient glows ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(0,255,163,0.13) 0%, transparent 65%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 85% 90%, rgba(0,80,60,0.07) 0%, transparent 60%)',
        }}
      />

      {/* ── Subtle dot grid ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,255,163,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Main container ── */}
      <div className="relative w-full max-w-[420px] animate-fade-in">

        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" aria-label="Bosh sahifa" className="group">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -m-2 rounded-3xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: 'rgba(0,255,163,0.25)' }}
              />
              <Logo className="relative size-[60px] drop-shadow-[0_0_14px_rgba(0,255,163,0.45)]" />
            </div>
          </Link>

          <div className="text-center">
            <h1 className="font-display text-[1.7rem] font-black tracking-tight">
              <span className="text-[#F8FAFC]">SM</span>
              {' '}
              <span
                className="text-[#00FFA3]"
                style={{ textShadow: '0 0 24px rgba(0,255,163,0.55)' }}
              >
                STREAM
              </span>
            </h1>
            <p className="mt-1.5 text-[11px] tracking-widest text-[#3D5265] uppercase">
              Video striming · AI ovozli platforma
            </p>
          </div>
        </div>

        {/* ── Card with gradient border ── */}
        <div
          className="relative rounded-[1.6rem] p-px"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,255,163,0.35) 0%, rgba(0,255,163,0.06) 45%, rgba(0,255,163,0.18) 100%)',
          }}
        >
          {/* Inner card */}
          <div className="relative overflow-hidden rounded-[calc(1.6rem-1px)] bg-[#0C1518]/96 px-7 py-8 backdrop-blur-2xl sm:px-8 sm:py-9">

            {/* Top shimmer line */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 5%, rgba(0,255,163,0.5) 50%, transparent 95%)',
              }}
            />

            {step === 'email' ? (
              <div className="animate-fade-in">

                {/* Step icon + title */}
                <div className="mb-6 flex items-center gap-3.5">
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(0,255,163,0.18) 0%, rgba(0,255,163,0.04) 100%)',
                      border: '1px solid rgba(0,255,163,0.22)',
                      boxShadow: '0 0 18px rgba(0,255,163,0.1)',
                    }}
                  >
                    <Mail size={19} className="text-[#00FFA3]" />
                  </div>
                  <div>
                    <h2 className="font-display text-[1.2rem] font-bold leading-tight text-[#F0F4F8]">
                      Tizimga kirish
                    </h2>
                    <p className="mt-0.5 text-[11px] text-[#3D5265]">
                      Emailga tasdiqlash kodi yuboriladi
                    </p>
                  </div>
                </div>

                {/* Google button */}
                <div className="mb-1 w-full min-h-[44px]">
                  <GoogleSignInButton clientId={activeClientId} onError={setError} />
                </div>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div
                    className="h-px flex-1"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(0,255,163,0.14), transparent)',
                    }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2E4355]">
                    yoki email orqali
                  </span>
                  <div
                    className="h-px flex-1"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(0,255,163,0.14), transparent)',
                    }}
                  />
                </div>

                <form id="login-email-form" onSubmit={sendCode} className="flex flex-col gap-4">

                  {/* Email field */}
                  <div className="group/field">
                    <label
                      htmlFor="email-input"
                      className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#3D5265]"
                    >
                      <span
                        className="inline-block size-1 rounded-full"
                        style={{ background: '#00FFA3', boxShadow: '0 0 4px rgba(0,255,163,0.8)' }}
                      />
                      Email manzili
                    </label>

                    <div
                      className="relative flex items-center gap-3 rounded-2xl px-4 transition-all duration-300"
                      style={{
                        minHeight: '54px',
                        background: 'rgba(8, 14, 17, 0.7)',
                        border: '1px solid rgba(0,255,163,0.13)',
                      }}
                    >
                      {/* Focus ring overlay */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-all duration-300 group-focus-within/field:opacity-100"
                        style={{
                          boxShadow:
                            '0 0 0 1.5px rgba(0,255,163,0.55), 0 0 22px rgba(0,255,163,0.09)',
                        }}
                      />
                      <Mail
                        size={15}
                        className="relative z-10 shrink-0 text-[#2E4355] transition-colors duration-300 group-focus-within/field:text-[#00FFA3]"
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
                        }}
                        placeholder="sizning@email.com"
                        disabled={loading}
                        required
                        className="relative z-10 w-full min-w-0 border-none bg-transparent text-[13.5px] text-[#EDF2F7] shadow-none outline-none ring-0 placeholder:text-[#233240] focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs font-medium text-[#F87171] animate-fade-in"
                      style={{
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.22)',
                      }}
                    >
                      <span className="mt-px shrink-0">⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    id="send-code-btn"
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="relative flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[13.5px] font-bold text-[#070A0C] transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #00FFA3 0%, #00D98A 100%)',
                      boxShadow:
                        !loading && email.trim()
                          ? '0 4px 22px rgba(0,255,163,0.38), 0 0 40px rgba(0,255,163,0.12)'
                          : 'none',
                    }}
                  >
                    {/* Shimmer sweep */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 translate-x-[-100%] skew-x-[-20deg] bg-white/20 transition-transform duration-700 hover:translate-x-[120%]"
                    />
                    {loading ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <>
                        <span>Kodni yuborish</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-[11.5px] text-[#2E4355]">
                  Akkauntingiz yo&apos;qmi?{' '}
                  <Link
                    href="/register"
                    className="font-bold text-[#00FFA3] transition-colors hover:text-[#33FFAF]"
                    style={{ textShadow: '0 0 10px rgba(0,255,163,0.28)' }}
                  >
                    Ro&apos;yxatdan o&apos;tish
                  </Link>
                </p>
              </div>

            ) : (
              /* ── STEP 2: CODE ── */
              <div className="animate-fade-in">

                {/* Step icon + title */}
                <div className="mb-6 flex items-center gap-3.5">
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(0,255,163,0.18) 0%, rgba(0,255,163,0.04) 100%)',
                      border: '1px solid rgba(0,255,163,0.22)',
                      boxShadow: '0 0 18px rgba(0,255,163,0.1)',
                    }}
                  >
                    <ShieldCheck size={19} className="text-[#00FFA3]" />
                  </div>
                  <div>
                    <h2 className="font-display text-[1.2rem] font-bold leading-tight text-[#F0F4F8]">
                      Kodni tasdiqlash
                    </h2>
                    <p className="mt-0.5 max-w-[200px] text-[11px] leading-relaxed text-[#3D5265]">
                      {info}
                    </p>
                  </div>
                </div>

                <form id="login-code-form" onSubmit={verifyCode} className="flex flex-col gap-4">

                  {/* Code input */}
                  <div className="group/field">
                    <label
                      htmlFor="code-input"
                      className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#3D5265]"
                    >
                      <span
                        className="inline-block size-1 rounded-full"
                        style={{ background: '#00FFA3', boxShadow: '0 0 4px rgba(0,255,163,0.8)' }}
                      />
                      6 xonali kod
                    </label>

                    <div
                      className="relative rounded-2xl transition-all duration-300"
                      style={{
                        background: 'rgba(8, 14, 17, 0.7)',
                        border: '1px solid rgba(0,255,163,0.13)',
                      }}
                    >
                      {/* Focus ring */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-all duration-300 group-focus-within/field:opacity-100"
                        style={{
                          boxShadow:
                            '0 0 0 1.5px rgba(0,255,163,0.55), 0 0 26px rgba(0,255,163,0.1)',
                        }}
                      />
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
                        disabled={loading}
                        required
                        className="relative z-10 w-full min-w-0 border-none bg-transparent px-6 py-5 text-center font-display text-[2rem] font-black tracking-[0.5em] text-[#00FFA3] shadow-none outline-none ring-0 placeholder:text-[#172630] placeholder:tracking-[0.35em] placeholder:text-[1.5rem] focus:ring-0"
                        style={{ textShadow: '0 0 14px rgba(0,255,163,0.45)' }}
                      />
                    </div>

                    {/* Progress indicator dots */}
                    <div className="mt-3 flex justify-center gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-[3px] w-7 rounded-full transition-all duration-200"
                          style={{
                            background: i < code.length ? '#00FFA3' : 'rgba(0,255,163,0.1)',
                            boxShadow: i < code.length ? '0 0 6px rgba(0,255,163,0.65)' : 'none',
                            transform: i < code.length ? 'scaleY(1.2)' : 'scaleY(1)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs font-medium text-[#F87171] animate-fade-in"
                      style={{
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.22)',
                      }}
                    >
                      <span className="mt-px shrink-0">⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Verify button */}
                  <button
                    id="verify-code-btn"
                    type="submit"
                    disabled={loading || code.length < 6}
                    className="relative flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[13.5px] font-bold text-[#070A0C] transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #00FFA3 0%, #00D98A 100%)',
                      boxShadow:
                        !loading && code.length >= 6
                          ? '0 4px 22px rgba(0,255,163,0.38), 0 0 40px rgba(0,255,163,0.12)'
                          : 'none',
                    }}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 translate-x-[-100%] skew-x-[-20deg] bg-white/20 transition-transform duration-700 hover:translate-x-[120%]"
                    />
                    {loading ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      'Tasdiqlash va Kirish'
                    )}
                  </button>

                  {/* Nav actions */}
                  <div
                    className="flex items-center justify-between rounded-xl px-3 py-0.5"
                    style={{ background: 'rgba(0,255,163,0.03)' }}
                  >
                    <button
                      type="button"
                      onClick={() => { setStep('email'); setCode(''); setError('') }}
                      className="flex min-h-[42px] items-center gap-1.5 px-2 text-xs text-[#3D5265] transition-colors hover:text-[#A0B8C4]"
                    >
                      <span>←</span>
                      <span>Emailni o&apos;zgartirish</span>
                    </button>
                    <div
                      className="h-3 w-px"
                      style={{ background: 'rgba(0,255,163,0.12)' }}
                    />
                    <button
                      type="button"
                      onClick={resendCode}
                      disabled={loading}
                      className="min-h-[42px] px-2 text-xs font-bold text-[#00FFA3] transition-colors hover:text-[#33FFAF] disabled:opacity-40"
                    >
                      Qayta yuborish
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Bottom register link */}
        <p className="mt-6 text-center text-[11.5px] text-[#2E4355]">
          Akkauntingiz yo&apos;qmi?{' '}
          <Link
            href="/register"
            className="font-bold text-[#00FFA3] transition-colors hover:text-[#33FFAF]"
            style={{ textShadow: '0 0 10px rgba(0,255,163,0.28)' }}
          >
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </p>
      </div>
    </div>
  )
}
