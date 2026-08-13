import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { VoiceAssistantProvider } from '@/components/voice-assistant-provider'
import VoiceOrb from '@/components/voice-orb'

export const metadata: Metadata = {
  title: { default: 'S-M — Kinolaringizni bepul tomosha qiling', template: '%s · S-M' },
  description: 'S-M — Netflix uslubidagi video striming platforma. Filmlar, seriallar va ovozli boshqaruv bir joyda.',
  keywords: ['streaming', 'kino', 'serial', 'video', 'ovozli boshqaruv', 'S-M', 'uzbek'],
  authors: [{ name: 'S-M' }],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'S-M' },
  openGraph: {
    title: 'S-M — Kinolaringizni bepul tomosha qiling',
    description: 'Netflix uslubidagi video striming platforma.',
    type: 'website',
    siteName: 'S-M',
    locale: 'uz_UZ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'S-M',
    description: 'Video striming platforma — ovozli boshqaruv bilan.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#f5a623',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className="bg-background">
      <body>
        <AuthProvider>
          <VoiceAssistantProvider>
            {children}
            <VoiceOrb />
          </VoiceAssistantProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
