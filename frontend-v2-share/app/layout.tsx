import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { GoogleAuthProvider } from '@/components/providers/google-auth-provider'
import { VoiceAssistantProvider } from '@/components/voice-assistant-provider'
import AppChrome from '@/components/app-chrome'
import VoiceOrb from '@/components/voice-orb'

export const metadata: Metadata = {
  title: { default: 'S-M — Video Streaming & AI Voice Platform', template: '%s · S-M Stream' },
  description: 'Cyber Emerald dizayni va 58 ta ovozli buyruqli AI Voice Agentga ega zamonaviy video striming platformasi.',
  keywords: ['streaming', 'kino', 'serial', 'video', 'ovozli boshqaruv', 'AI voice', 'S-M', 'uzbek'],
  authors: [{ name: 'S-M Stream Team' }],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'S-M Stream' },
  openGraph: {
    title: 'S-M — Video Streaming & AI Voice Platform',
    description: 'Filmlar, seriallar va to\'liq ovozli boshqaruv bir joyda.',
    type: 'website',
    siteName: 'S-M Stream',
    locale: 'uz_UZ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'S-M Stream',
    description: 'Video striming platformasi — AI ovozli boshqaruv bilan.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#00e599',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className="bg-[#080a0a]">
      <body className="bg-[#080a0a] text-[#f5f7f6] antialiased">
        <GoogleAuthProvider>
          <AuthProvider>
            <VoiceAssistantProvider>
              <AppChrome>
                {children}
              </AppChrome>
              <VoiceOrb />
            </VoiceAssistantProvider>
          </AuthProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  )
}
