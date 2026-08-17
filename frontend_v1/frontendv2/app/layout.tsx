import type { Metadata, Viewport } from 'next'
import './globals.css'
import { GoogleAuthProvider } from '@/components/providers/google-auth-provider'
import { AuthProvider } from '@/components/auth-provider'
import { VoiceAssistantProvider } from '@/components/voice-assistant-provider'

export const metadata: Metadata = {
  title: { default: 'StreamVibe — Video Streaming & AI Voice', template: '%s · StreamVibe' },
  description: 'Cyber Emerald dizayni va 58 ta ovozli buyruqli AI Voice Agentga ega zamonaviy video striming platformasi.',
  keywords: ['streaming', 'kino', 'serial', 'video', 'ovozli boshqaruv', 'AI voice', 'StreamVibe', 'uzbek'],
  authors: [{ name: 'StreamVibe Team' }],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'StreamVibe' },
  openGraph: {
    title: 'StreamVibe — Video Streaming & AI Voice',
    description: 'Filmlar, seriallar va to\'liq ovozli boshqaruv bir joyda.',
    type: 'website',
    siteName: 'StreamVibe',
    locale: 'uz_UZ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamVibe',
    description: 'Video striming platformasi — AI ovozli boshqaruv bilan.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#00FFA3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

/**
 * Root layout — only <html> + <body> + global providers.
 * Layout chrome (Sidebar/Header) is added per route group:
 *   (consumer)/layout.tsx  → Sidebar + Header
 *   (auth)/layout.tsx      → Clean centered layout
 *   (watch)/layout.tsx     → Full-screen, no chrome
 *   (admin)/layout.tsx     → Admin sidebar nav
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className="bg-[#070A0C]">
      <body className="bg-[#070A0C] text-[#F8FAFC] antialiased">
        <GoogleAuthProvider>
          <AuthProvider>
            <VoiceAssistantProvider>
              {children}
            </VoiceAssistantProvider>
          </AuthProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  )
}
