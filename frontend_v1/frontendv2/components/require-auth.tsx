'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function RequireAuth({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { loading, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()

  const blocked = !loading && (!isAuthenticated || (adminOnly && !isAdmin))

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) router.replace('/login')
    else if (adminOnly && !isAdmin) router.replace('/')
  }, [loading, isAuthenticated, isAdmin, adminOnly, router])

  if (loading || blocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0a]">
        <Loader2 className="animate-spin text-[#00e599]" size={36} />
        <span className="sr-only">Yuklanmoqda...</span>
      </main>
    )
  }

  return <>{children}</>
}
