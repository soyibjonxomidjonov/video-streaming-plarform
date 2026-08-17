'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, getRefreshToken, setToken, setRefreshToken, type UserProfile, API_BASE } from '@/lib/api'

type AuthState = {
  user: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  refresh: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4) {
          base64 += '='
        }
        let payload
        try {
          payload = JSON.parse(decodeURIComponent(escape(atob(base64))))
        } catch (err) {
          payload = JSON.parse(atob(base64))
        }

        // Validate token expiration
        const now = Math.floor(Date.now() / 1000)
        let isValid = true
        if (payload.exp && payload.exp < now) {
          isValid = false
          const refresh = getRefreshToken()
          if (refresh) {
            try {
              const res = await fetch(`${API_BASE}/v1/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
              })
              if (res.ok) {
                const data = await res.json()
                if (data?.access) {
                  setToken(data.access)
                  isValid = true
                }
              }
            } catch (e) {
              console.error('Refresh failed', e)
            }
          }
        }

        if (!isValid) {
          setToken(null)
          setRefreshToken(null)
          setUser(null)
          setLoading(false)
          return
        }

        // Fallback user object from JWT claims
        let fallbackUser: UserProfile = {
          id: payload.user_id,
          email: payload.email ?? payload.username ?? '',
          first_name: payload.first_name ?? '',
          last_name: payload.last_name ?? '',
          is_staff: Boolean(payload.is_staff),
          is_superuser: Boolean(payload.is_superuser),
        }

        if (payload.user_id) {
          try {
            const userData = await api.user(payload.user_id)
            fallbackUser = {
              ...fallbackUser,
              ...(userData || {}),
              is_superuser: fallbackUser.is_superuser || userData?.is_superuser,
              is_staff: fallbackUser.is_staff || userData?.is_staff,
              email: userData?.email || fallbackUser.email || '',
              first_name: userData?.first_name || fallbackUser.first_name || '',
            }
          } catch {
            // Ignore API fetch errors
          }
        }

        // Merge locally saved profile data for local overrides
        if (typeof window !== 'undefined') {
          try {
            const localProfile = JSON.parse(localStorage.getItem('streamora_local_profile') || '{}')
            fallbackUser = { ...fallbackUser, ...localProfile }
          } catch {}
        }

        setUser(fallbackUser)
      } else {
        setToken(null)
        setRefreshToken(null)
        setUser(null)
      }
    } catch (e) {
      console.error('Failed to parse token', e)
      setToken(null)
      setRefreshToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setRefreshToken(null)
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('streamora_local_profile')
      localStorage.removeItem('streamora_profile_avatar')
      window.dispatchEvent(new Event('profile_updated'))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.is_staff || user?.is_superuser || user?.role === 'admin'),
      refresh,
      logout,
    }),
    [user, loading, refresh, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
