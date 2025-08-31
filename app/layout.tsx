import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/lib/languageContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({ 
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MelodiDunyasi - AI-Powered Personalized Songs for Special Moments',
  description: 'Create your perfect wedding song, birthday anthem, or anniversary melody with our AI-powered platform. Pay once, get 3 tries to perfect your personalized song.',
  keywords: 'personalized songs, AI music, wedding songs, birthday songs, anniversary songs, custom music, AI song generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} font-sans`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
