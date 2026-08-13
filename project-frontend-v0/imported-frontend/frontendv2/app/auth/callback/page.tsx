'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
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
    <main className="flex min-h-screen items-center justify-center p-4" style={{ background: '#0a0a0c' }}>
      <div className="rounded-2xl border border-border p-8 text-center" style={{ background: '#16161a' }}>
        {error ? (
          <p role="alert" className="text-sm text-red-400">{error}</p>
        ) : (
          <LoaderCircle className="mx-auto animate-spin" size={32} style={{ color: '#f5a623' }} />
        )}
        <p className="mt-4 text-sm text-muted-foreground">
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
        <main className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a0c' }}>
          <LoaderCircle className="animate-spin" size={32} style={{ color: '#f5a623' }} />
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
