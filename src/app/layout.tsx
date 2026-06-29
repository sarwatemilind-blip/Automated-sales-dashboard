import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Adonis Pharma Analytics Platform',
  description: 'Enterprise-grade pharmaceutical sales analytics platform',
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
