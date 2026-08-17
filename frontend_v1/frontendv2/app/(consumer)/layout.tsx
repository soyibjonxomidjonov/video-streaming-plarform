import React from 'react'
import ConsumerChrome from '@/components/app-chrome'
import { VoiceOrb } from '@/components/voice-orb'

/**
 * Consumer layout — wraps all public/user pages:
 * /, /movies, /series, /genre/*, /genres, /explore,
 * /search, /favorites, /history, /movie/*, /series/*,
 * /profile, /settings, /verify, 404
 *
 * Renders ConsumerChrome (Sidebar + Header + main content wrapper).
 * VoiceOrb — global floating AI toggle (fixed bottom-right).
 * <html>/<body> are in root layout.tsx — not duplicated here.
 */
export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConsumerChrome>{children}</ConsumerChrome>
      <VoiceOrb />
    </>
  )
}
