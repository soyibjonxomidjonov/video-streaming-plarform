'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
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
      <main className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="animate-spin text-primary" size={32} />
        <span className="sr-only">Loading</span>
      </main>
    )
  }

  return <>{children}</>
}
