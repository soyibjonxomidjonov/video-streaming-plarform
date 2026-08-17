'use client'

import React, { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { Loader2 } from 'lucide-react'
import { setToken, setRefreshToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'

export function GoogleLoginButton() {
  const { refresh } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true)
        setError(null)

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'https://backend.scholarmap.uz'

        let response = await fetch(`${apiUrl}/v1/auth/google/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_token: tokenResponse.access_token,
            access_token: tokenResponse.access_token,
          }),
        })

        if (!response.ok && response.status === 404) {
          response = await fetch(`${apiUrl}/v1/auth/google/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_token: tokenResponse.access_token,
              access_token: tokenResponse.access_token,
            }),
          })
        }

        if (!response.ok) {
          throw new Error('Serverda Google autentifikatsiya xatosi yuz berdi')
        }

        const data = await response.json()

        if (data.access) {
          setToken(data.access)
          if (data.refresh) setRefreshToken(data.refresh)
          await refresh()
          window.location.href = '/'
        } else if (data.token) {
          setToken(data.token)
          await refresh()
          window.location.href = '/'
        } else {
          throw new Error('Token olinmadi')
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Tizimga kirishda xatolik yuz berdi'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('Google orqali kirish bekor qilindi'),
  })

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        id="google-signin-btn"
        type="button"
        onClick={() => login()}
        disabled={loading}
        className="group relative flex w-full min-h-[52px] items-center justify-center gap-3 overflow-hidden rounded-full border px-5 text-[13.5px] font-semibold text-[#CBD5E1] transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: 'rgba(16, 21, 20, 0.85)',
          border: '1px solid rgba(0, 229, 153, 0.2)',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = '1px solid rgba(0,229,153,0.55)'
          e.currentTarget.style.boxShadow = '0 0 22px rgba(0,229,153,0.15)'
          e.currentTarget.style.color = '#F0F4F8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = '1px solid rgba(0,229,153,0.2)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.color = '#CBD5E1'
        }}
      >
        {/* Shimmer sweep on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/[0.04] transition-transform duration-700 group-hover:translate-x-full"
        />

        {loading ? (
          <>
            <Loader2 className="h-[18px] w-[18px] animate-spin text-[#00e599]" />
            <span>Google orqali tasdiqlanmoqda...</span>
          </>
        ) : (
          <>
            {/* Google "G" SVG logo */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.1254-.8427 2.0791-1.7963 2.7186v2.2581h2.9086c1.7018-1.5668 2.6841-3.874 2.6841-6.619z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1818l-2.9086-2.2581c-.8059.54-1.8368.8591-3.0478.8591-2.3441 0-4.3282-1.5832-5.036-3.7105H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
                fill="#EA4335"
              />
            </svg>

            <span>Google hisobingiz bilan kiring</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-center text-xs font-bold text-[#ff4d6d]">{error}</p>
      )}
    </div>
  )
}

export default GoogleLoginButton
