import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RoamRiot — Your AI Travel Companion',
  description: 'Personalized travel itineraries built from real traveler vlogs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
