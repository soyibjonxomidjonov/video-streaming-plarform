'use client'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, User, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { api, ApiError, setToken, setRefreshToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import GoogleSignInButton from '@/components/google-sign-in-button'
import { Logo } from '@/components/ui/logo'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidName(name: string): boolean {
  return name.trim().length >= 2
}

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

  // Real-time validation touched states
  const [firstNameTouched, setFirstNameTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [ageTouched, setAgeTouched] = useState(false)

  const firstNameError = firstNameTouched && !isValidName(firstName) ? "Ism kamida 2 harf bo'lishi kerak" : ''
  const emailError = emailTouched && email && !isValidEmail(email) ? "To'g'ri email manzil kiriting" : ''
  const ageError = ageTouched && age && (Number(age) < 1 || Number(age) > 120) ? 'Yosh 1–120 oralig\'ida bo\'lishi kerak' : ''

  const activeClientId =
    googleClientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '106374320593-u4o15ahs5g3t798kvl6c4e6vte9lnn5s.apps.googleusercontent.com'

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    // Trigger all validations
    setFirstNameTouched(true)
    setEmailTouched(true)
    if (!isValidName(firstName) || !isValidEmail(email)) return

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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#070A0C]">
      {/* Background radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 20%, rgba(0,255,163,0.08) 0%, transparent 80%)',
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" aria-label="Bosh sahifaga qaytish" className="flex flex-col items-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border-2 border-[rgba(0,255,163,0.2)] bg-[#0B1013] shadow-[0_0_20px_rgba(0,255,163,0.1)] transition-transform hover:scale-105">
              <span className="font-display text-2xl font-black text-[#00FFA3]">SM</span>
            </div>
            <div className="mt-4 text-center">
              <h1 className="font-display text-[22px] font-black tracking-wider text-[#F8FAFC]">
                SM <span className="text-[#00FFA3]">STREAM</span>
              </h1>
              <p className="mt-1 text-[13px] text-[#64748B]">Ro&apos;yxatdan o&apos;tish</p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="w-full min-w-0 rounded-[24px] border border-[rgba(0,255,163,0.15)] bg-[#0F171A]/95 p-7 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {step === 'form' ? (
            <>
              {/* Header Icon & Title */}
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl border border-[#00FFA3]/30 bg-[#00FFA3]/10 shadow-[0_0_15px_rgba(0,255,163,0.15)] text-[#00FFA3]">
                <User size={22} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <h2 className="font-display text-[22px] font-bold text-[#F8FAFC]">Akkaunt yaratish</h2>
              <p className="mt-1 text-[13px] text-[#94A3B8]">
                Ma&apos;lumotlaringizni kiriting va emailingizni tasdiqlang
              </p>

              {/* Google Sign In */}
              <div className="mt-6 mb-2">
                <GoogleSignInButton clientId={activeClientId} onError={setError} />
                <div className="my-6 flex items-center justify-center gap-4 relative" aria-hidden="true">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[rgba(0,255,163,0.2)] to-transparent" />
                  </div>
                  <span className="relative bg-[#0F171A] px-4 text-[12px] font-medium text-[#64748B]">
                    yoki ma&apos;lumotlar bilan
                  </span>
                </div>
              </div>

              <form id="register-form" onSubmit={sendCode} className="flex flex-col gap-4" noValidate>
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label htmlFor="first-name" className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                      Ism <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className={`relative flex items-center rounded-xl border transition min-h-[46px] ${
                      firstNameError ? 'border-[#EF4444] bg-[#EF4444]/05' : 'border-[rgba(0,255,163,0.2)] bg-[#0B1013] focus-within:border-[#00FFA3]'
                    }`}>
                      <div className="pl-3.5 pr-2.5 flex items-center justify-center text-[#00FFA3]/70">
                        <User size={16} />
                      </div>
                      <input
                        id="first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); if (!firstNameTouched) setFirstNameTouched(true) }}
                        onBlur={() => setFirstNameTouched(true)}
                        placeholder="Ali"
                        className="w-full bg-transparent text-[13px] text-[#F8FAFC] outline-none placeholder:text-[#4B5563] pr-3"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label htmlFor="last-name" className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                      Familiya
                    </label>
                    <div className="relative flex items-center rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] transition min-h-[46px] focus-within:border-[#00FFA3]">
                      <div className="pl-3.5 pr-2.5 flex items-center justify-center text-[#00FFA3]/70">
                        <User size={16} />
                      </div>
                      <input
                        id="last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Valiyev"
                        className="w-full bg-transparent text-[13px] text-[#F8FAFC] outline-none placeholder:text-[#4B5563] pr-3"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-email" className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    Email manzili <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className={`relative flex items-center rounded-xl border transition min-h-[46px] ${
                    emailError ? 'border-[#EF4444] bg-[#EF4444]/05' : 'border-[rgba(0,255,163,0.2)] bg-[#0B1013] focus-within:border-[#00FFA3]'
                  }`}>
                    <div className="pl-3.5 pr-2.5 flex items-center justify-center text-[#00FFA3]/70">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); if (!emailTouched) setEmailTouched(true) }}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="sizning@email.com"
                      className="w-full bg-transparent text-[13px] text-[#F8FAFC] outline-none placeholder:text-[#4B5563] pr-3"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Age */}
                <div className="flex flex-col gap-1.5 relative">
                  <label htmlFor="age" className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    Yosh <span className="font-normal text-[#64748B] normal-case">(ixtiyoriy)</span>
                  </label>
                  <div className="w-1/2 relative flex items-center rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] transition min-h-[46px] focus-within:border-[#00FFA3]">
                    <div className="pl-3.5 pr-2.5 flex items-center justify-center text-[#00FFA3]/70">
                      <div className="size-4 rounded-[4px] border-[1.5px] border-current flex items-center justify-center text-[8px] font-bold">20</div>
                    </div>
                    <input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => { setAge(e.target.value); if (!ageTouched) setAgeTouched(true) }}
                      onBlur={() => setAgeTouched(true)}
                      placeholder="20"
                      className="w-full bg-transparent text-[13px] text-[#F8FAFC] outline-none placeholder:text-[#4B5563] pr-3"
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <p role="alert" className="mt-1 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-3 text-[13px] font-medium text-[#EF4444]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !firstName.trim()}
                  className="mt-3 flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#00FFA3] text-[14.5px] font-bold text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.25)] transition hover:bg-[#1AFFA8] active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>Ro&apos;yxatdan o&apos;tish <ArrowRight size={18} /></>}
                </button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-[13px] text-[#64748B]">Akkauntingiz bormi?</span>{' '}
                <Link href="/login" className="text-[13px] font-bold text-[#F8FAFC] hover:text-[#00FFA3] transition-colors">
                  Tizimga kirish
                </Link>
              </div>
            </>
          ) : (
            /* CODE STEP */
            <>
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl border border-[#00FFA3]/30 bg-[#00FFA3]/10 shadow-[0_0_15px_rgba(0,255,163,0.15)] text-[#00FFA3]">
                <KeyRound size={22} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <h2 className="font-display text-[22px] font-bold text-[#F8FAFC]">Kodni tasdiqlang</h2>
              <p className="mt-1.5 text-[13px] text-[#94A3B8]" aria-live="polite">
                <span className="text-[#00FFA3] font-semibold">{email}</span> ga 6 xonali kod yuborildi
              </p>

              <form id="register-code-form" onSubmit={verifyCode} className="mt-6 flex flex-col gap-4">
                <div>
                  <label htmlFor="code-input-reg" className="mb-2 block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    6 xonali tasdiqlash kodi
                  </label>
                  <input
                    id="code-input-reg"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                    placeholder="123456"
                    className="w-full min-w-0 rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-4 py-4 text-center font-display text-2xl font-black tracking-widest text-[#00FFA3] outline-none transition focus:border-[#00FFA3] focus:shadow-[0_0_15px_rgba(0,255,163,0.15)] min-h-[56px]"
                    required
                    disabled={loading}
                  />
                  <p id="reg-code-hint" className="mt-2 text-[12px] text-[#64748B]">
                    Emailingizga yuborilgan 6 raqamli kodni kiriting
                  </p>
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-3 text-[13px] font-medium text-[#EF4444]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#00FFA3] py-3.5 text-[14.5px] font-bold text-[#070A0C] shadow-[0_0_20px_rgba(0,255,163,0.25)] transition hover:bg-[#1AFFA8] active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Tasdiqlash va Boshlash'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="mt-2 min-h-[44px] text-center text-[13px] text-[#64748B] hover:text-[#F8FAFC] transition-colors"
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
