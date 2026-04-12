import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' })
const mono    = Space_Mono({ subsets: ['latin'], weight: ['400','700'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'FocusLens — Know When You Learn Best',
  description: 'AI-powered learning focus tracker. Beat burnout before it beats you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${grotesk.variable} ${mono.variable} font-sans bg-brand-white text-brand-black antialiased`}>
        {children}
      </body>
    </html>
  )
}
