'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError, setRefreshToken, setToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            itp_support?: boolean
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
          prompt?: () => void
        }
      }
    }
  }
}

let gsiScriptPromise: Promise<void> | null = null

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.accounts?.id) return Promise.resolve()
  if (gsiScriptPromise) return gsiScriptPromise

  gsiScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-identity-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.id = 'google-identity-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google skripti yuklanmadi'))
    document.head.appendChild(script)
  })
  return gsiScriptPromise
}

type GoogleSignInButtonProps = {
  clientId: string
  onError?: (message: string) => void
}

export default function GoogleSignInButton({ clientId, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { refresh } = useAuth()
  const [loading, setLoading] = useState(false)
  const domId = useId()

  useEffect(() => {
    if (!clientId) return
    let cancelled = false

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !containerRef.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          itp_support: true,
          callback: async response => {
            setLoading(true)
            try {
              const result = await api.googleLogin(response.credential)
              if (!result?.access) throw new Error('missing-token')
              setToken(result.access)
              setRefreshToken(result.refresh ?? null)
              await refresh()
              router.replace('/')
            } catch (err) {
              const message =
                err instanceof ApiError
                  ? err.message
                  : 'Google orqali kirishda xatolik yuz berdi. Qaytadan urining.'
              onError?.(message)
            } finally {
              setLoading(false)
            }
          },
        })
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 320,
        })
      })
      .catch(() => {
        onError?.('Google xizmatiga ulanib bo\'lmadi. Internetni tekshiring.')
      })

    return () => {
      cancelled = true
    }
  }, [clientId, onError, refresh, router])

  if (!clientId) return null

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div id={`gsi-${domId}`} ref={containerRef} className="flex w-full justify-center [&>div]:w-full" />
      {loading && <p className="text-xs text-muted-foreground">Kirilmoqda...</p>}
    </div>
  )
}
