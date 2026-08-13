'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken, type UserProfile } from '@/lib/api'

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
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const token = getToken()
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.user_id) {
          try {
            const userData = await api.user(payload.user_id)
            setUser(userData)
          } catch (err) {
            // Token is invalid, expired, or backend returned an error — log out!
            console.warn('Invalid token or user fetch failed, clearing session:', err)
            setToken(null)
            setUser(null)
          }
        } else {
          setToken(null)
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (e) {
      console.error('Failed to parse token or fetch user profile', e)
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
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
