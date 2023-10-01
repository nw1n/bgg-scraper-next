import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BGG Game owner Scraper',
  description: 'BGG Game owner Scraper',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
