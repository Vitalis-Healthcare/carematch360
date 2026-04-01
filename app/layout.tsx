import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CareMatch360',
  description: 'Provider-Client Matching & Dispatch Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
