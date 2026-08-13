import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { VoiceAssistantProvider } from '@/components/voice-assistant-provider'
import VoiceOrb from '@/components/voice-orb'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })

export const metadata: Metadata = {
  title: { default: 'Streamora — Watch what moves you', template: '%s · Streamora' },
  description: 'Streamora is a cinematic streaming platform with voice control, smart search and a vast catalog of movies and series.',
  keywords: ['streaming', 'movies', 'series', 'video', 'voice control', 'Streamora'],
  authors: [{ name: 'Streamora' }],
  openGraph: {
    title: 'Streamora — Watch what moves you',
    description: 'A cinematic streaming experience with voice control and smart search.',
    type: 'website',
    siteName: 'Streamora',
  },
  twitter: { card: 'summary_large_image', title: 'Streamora', description: 'A cinematic streaming experience.' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0a0715',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.variable} ${space.variable}`}>
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
