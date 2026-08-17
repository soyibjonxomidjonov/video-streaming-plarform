'use client'

import React from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'

const DEFAULT_CLIENT_ID = '106374320593-u4o15ahs5g3t798kvl6c4e6vte9lnn5s.apps.googleusercontent.com'

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}
