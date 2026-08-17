'use client'

import React, { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Loader2, ArrowRight } from 'lucide-react'
import { api, ApiError, setToken, setRefreshToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { Logo } from '@/components/ui/logo'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const { refresh } = useAuth()

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || code.length < 6) return
    setLoading(true)
    setError('')
    try {
      const result = await api.verifyCode(email.trim().toLowerCase(), code.trim())
      setToken(result.access)
      setRefreshToken(result.refresh)
      await refresh()
      router.replace('/')
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError('Noto\'g\'ri tasdiqlash kodi. Qaytadan tekshirib kiritib ko\'ring.')
      } else {
        setError('Xatolik yuz berdi. Qaytadan urining.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#080a0a]">
      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="group">
            <Logo className="size-14" />
          </Link>
          <div className="text-center">
            <h1 className="font-display text-2xl font-black text-[#f5f7f6]">
              S<span className="text-[#00e599]">-</span>M STREAM
            </h1>
            <p className="mt-1 text-xs text-[#8c9994]">Kodni tasdiqlash</p>
          </div>
        </div>

        <div className="rounded-3xl border border-[rgba(0,229,153,0.2)] bg-[#101514]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-[rgba(0,229,153,0.12)] text-[#00e599]">
            <KeyRound size={20} />
          </div>
          <h2 className="font-display text-xl font-bold text-[#f5f7f6]">Kodni tasdiqlash</h2>
          <p className="mt-1 text-xs text-[#8c9994]">
            Emailingizga yuborilgan 6 xonali tasdiqlash kodini kiriting
          </p>

          <form onSubmit={handleVerify} className="mt-5 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-[#f5f7f6]">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sizning@email.com"
                className="w-full rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#161f1c] px-4 py-2.5 text-xs text-[#f5f7f6] outline-none focus:border-[#00e599]"
                required
              />
            </div>

            <div>
              <label htmlFor="code" className="mb-1.5 block text-xs font-bold text-[#f5f7f6]">6 xonali kod</label>
              <input
                id="code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full rounded-2xl border border-[rgba(0,229,153,0.25)] bg-[#161f1c] px-4 py-3 text-center font-display text-2xl font-black tracking-widest text-[#00e599] outline-none focus:border-[#00e599]"
                required
              />
            </div>

            {error && (
              <p className="rounded-xl border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 px-4 py-2.5 text-xs font-bold text-[#ff4d6d]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6 || !email.trim()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#00e599] py-3.5 text-xs font-bold text-[#080a0a] shadow-[0_0_20px_rgba(0,229,153,0.4)] transition hover:bg-[#1df2ad] active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Tasdiqlash va Kirish'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#8c9994]">
            <Link href="/login" className="text-[#00e599] font-bold hover:underline">
              ← Login sahifasiga qaytish
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#080a0a]"><Loader2 className="animate-spin text-[#00e599]" size={36} /></div>}>
      <VerifyContent />
    </Suspense>
  )
}
