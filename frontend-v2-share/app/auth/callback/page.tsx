'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { setToken, setRefreshToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

function AuthCallbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('access') ?? params.get('token') ?? params.get('key') ?? params.get('access_token')
    const refreshTok = params.get('refresh')
    if (!token) {
      setError('Google orqali kirishda token olinmadi.')
      return
    }
    setToken(token)
    if (refreshTok) setRefreshToken(refreshTok)
    void refresh().then(() => router.replace('/'))
  }, [params, refresh, router])

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#080a0a]">
      <div className="rounded-3xl border border-[rgba(0,229,153,0.2)] bg-[#101514] p-8 text-center shadow-2xl">
        {error ? (
          <p role="alert" className="text-sm font-bold text-[#ff4d6d]">{error}</p>
        ) : (
          <Loader2 className="mx-auto animate-spin text-[#00e599]" size={36} />
        )}
        <p className="mt-4 text-xs text-[#8c9994]">
          {error ? 'Iltimos, login sahifasiga qaytib qaytadan urining.' : 'Google orqali kirish yakunlanmoqda...'}
        </p>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#080a0a]">
          <Loader2 className="animate-spin text-[#00e599]" size={36} />
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
