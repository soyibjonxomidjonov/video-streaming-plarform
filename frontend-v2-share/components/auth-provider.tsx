'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken, setRefreshToken, type UserProfile } from '@/lib/api'

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
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        // Fallback user object from JWT claims
        const fallbackUser: UserProfile = {
          id: payload.user_id,
          email: payload.email ?? payload.username ?? 'Foydalanuvchi',
          is_staff: Boolean(payload.is_staff),
          is_superuser: Boolean(payload.is_superuser),
        }

        if (payload.user_id) {
          try {
            const userData = await api.user(payload.user_id)
            setUser(userData ?? fallbackUser)
          } catch {
            // Backend permission error on /v1/users/{id}/ — DO NOT log out!
            // Use the valid JWT payload user state
            setUser(fallbackUser)
          }
        } else {
          setUser(fallbackUser)
        }
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
