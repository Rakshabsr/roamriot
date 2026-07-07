import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { SessionGuard } from '@/components/ui/SessionGuard'

export const metadata: Metadata = {
  title: 'RoamRiot — Your AI Travel Companion',
  description: 'Personalized travel itineraries built from real traveler vlogs.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RoamRiot',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#00a896',
  },
}

// Prevent flash of wrong theme — runs before React hydrates
// Default to dark mode unless user has explicitly chosen light
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('roamriot_theme');
    if (!t) { t = 'dark'; localStorage.setItem('roamriot_theme', 'dark'); }
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch(e) { document.documentElement.classList.add('dark'); }
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[#f4faf8] dark:bg-[#0a0f0e] transition-colors duration-200">
        <ThemeProvider>
          <SessionGuard />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
