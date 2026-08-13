'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { setToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

function AuthCallbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token') ?? params.get('access') ?? params.get('key') ?? params.get('access_token')
    if (!token) {
      setError('Google login did not return a session token.')
      return
    }
    setToken(token)
    void refresh().then(() => router.replace('/'))
  }, [params, refresh, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        {error ? <p role="alert" className="text-sm text-accent">{error}</p> : <LoaderCircle className="mx-auto animate-spin text-primary" />}
        <p className="mt-4 text-sm text-muted-foreground">{error ? 'Please return to login and try again.' : 'Completing Google sign in...'}</p>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background"><LoaderCircle className="animate-spin text-primary" /></main>}>
      <AuthCallbackContent />
    </Suspense>
  )
}
