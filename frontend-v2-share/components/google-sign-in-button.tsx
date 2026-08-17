'use client'

import React from 'react'
import { GoogleLoginButton } from '@/components/auth/google-login-button'

type GoogleSignInButtonProps = {
  clientId?: string
  onError?: (message: string) => void
}

export default function GoogleSignInButton({ clientId, onError }: GoogleSignInButtonProps) {
  return <GoogleLoginButton />
}
