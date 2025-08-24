import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/lib/languageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Song Creation Platform - Create Your Personalized Songs',
  description: 'Create personalized songs for special occasions with AI-powered song generation, voice cloning, and video creation.',
  keywords: 'song creation, AI music, voice cloning, video generation, personalized songs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
