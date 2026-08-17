'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, User, KeyRound, Loader2 } from 'lucide-react'
import { api, ApiError, setToken, setRefreshToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import GoogleSignInButton from '@/components/google-sign-in-button'
import { Logo } from '@/components/ui/logo'

export default function RegisterForm({ googleClientId }: { googleClientId?: string }) {
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

  const activeClientId =
    googleClientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '106374320593-u4o15ahs5g3t798kvl6c4e6vte9lnn5s.apps.googleusercontent.com'

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
      setError(
        err instanceof ApiError ? err.message : "Ro'yxatdan o'tilmadi. Qaytadan urining."
      )
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
      setError(
        err instanceof ApiError && err.status === 400
          ? "Noto'g'ri tasdiqlash kodi."
          : 'Xatolik yuz berdi.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#070A0C]">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(0,255,163,0.1) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="group" aria-label="Bosh sahifa">
            <Logo className="size-14" />
          </Link>
          <div className="text-center">
            <h1 className="font-display text-2xl font-black tracking-tight text-[#F8FAFC]">
              S<span className="text-[#00FFA3]">-</span>M STREAM
            </h1>
            <p className="mt-1 text-xs text-[#64748B]">Ro&apos;yxatdan o&apos;tish</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full min-w-0 rounded-2xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A]/90 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {step === 'form' ? (
            <>
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[rgba(0,255,163,0.1)] text-[#00FFA3]">
                <User size={20} />
              </div>
              <h2 className="font-display text-xl font-bold text-[#F8FAFC]">Akkaunt yaratish</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Ma&apos;lumotlaringizni kiriting va emailingizni tasdiqlang
              </p>

              {/* Google Sign In */}
              <div className="mt-5 mb-1 min-h-[44px]">
                <GoogleSignInButton clientId={activeClientId} onError={setError} />
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[rgba(0,255,163,0.12)]" />
                  <span className="text-xs text-[#64748B]">yoki ma&apos;lumotlar bilan</span>
                  <div className="h-px flex-1 bg-[rgba(0,255,163,0.12)]" />
                </div>
              </div>

              <form id="register-form" onSubmit={sendCode} className="flex flex-col gap-4">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label htmlFor="first-name" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
                      Ism
                    </label>
                    <input
                      id="first-name"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ali"
                      className="w-full min-w-0 rounded-xl border border-[rgba(0,255,163,0.18)] bg-[#0B1013] px-3.5 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#00FFA3] focus:ring-1 focus:ring-[#00FFA3] placeholder:text-[#64748B] min-h-[44px]"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label htmlFor="last-name" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
                      Familiya
                    </label>
                    <input
                      id="last-name"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Valiyev"
                      className="w-full min-w-0 rounded-xl border border-[rgba(0,255,163,0.18)] bg-[#0B1013] px-3.5 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#00FFA3] focus:ring-1 focus:ring-[#00FFA3] placeholder:text-[#64748B] min-h-[44px]"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-email" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
                    Email manzili
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="sizning@email.com"
                    className="w-full min-w-0 rounded-xl border border-[rgba(0,255,163,0.18)] bg-[#0B1013] px-4 py-3.5 text-sm text-[#F8FAFC] outline-none transition focus:border-[#00FFA3] focus:ring-1 focus:ring-[#00FFA3] placeholder:text-[#64748B] min-h-[50px]"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Age */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="age" className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
                    Yosh <span className="font-normal text-[#64748B] normal-case">(ixtiyoriy)</span>
                  </label>
                  <input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="20"
                    className="w-full min-w-0 rounded-xl border border-[rgba(0,255,163,0.18)] bg-[#0B1013] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[#00FFA3] focus:ring-1 focus:ring-[#00FFA3] placeholder:text-[#64748B] min-h-[44px]"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/08 px-4 py-2.5 text-xs font-medium text-[#EF4444]">
                    {error}
                  </p>
                )}

                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={loading || !email.trim() || !firstName.trim()}
                  className="mt-1 flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#00FFA3] py-3.5 text-sm font-bold text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.35)] transition hover:bg-[#1AFFA8] hover:shadow-[0_0_28px_rgba(0,255,163,0.5)] active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>Ro&apos;yxatdan o&apos;tish <ArrowRight size={15} /></>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-[#64748B]">
                Akkauntingiz bormi?{' '}
                <Link href="/login" className="font-bold text-[#00FFA3] hover:underline">
                  Tizimga kirish
                </Link>
              </p>
            </>
          ) : (
            /* CODE STEP */
            <>
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[rgba(0,255,163,0.1)] text-[#00FFA3]">
                <KeyRound size={20} />
              </div>
              <h2 className="font-display text-xl font-bold text-[#F8FAFC]">Kodni tasdiqlang</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                <span className="text-[#00FFA3] font-semibold">{email}</span> ga 6 xonali kod yuborildi
              </p>

              <form id="register-code-form" onSubmit={verifyCode} className="mt-5 flex flex-col gap-4">
                <input
                  id="code-input-reg"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                  placeholder="123456"
                  className="w-full min-w-0 rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-4 py-4 text-center font-display text-2xl font-black tracking-widest text-[#00FFA3] outline-none transition focus:border-[#00FFA3] focus:shadow-[0_0_12px_rgba(0,255,163,0.2)] min-h-[60px]"
                  required
                  disabled={loading}
                />

                {error && (
                  <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/08 px-4 py-2.5 text-xs font-medium text-[#EF4444]">
                    {error}
                  </p>
                )}

                <button
                  id="verify-register-btn"
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#00FFA3] py-3.5 text-sm font-bold text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.35)] transition hover:bg-[#1AFFA8] active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Tasdiqlash va Boshlash'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="min-h-[44px] text-center text-xs text-[#64748B] transition hover:text-[#F8FAFC]"
                >
                  ← Ma&apos;lumotlarni o&apos;zgartirish
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
