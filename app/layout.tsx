import type { Metadata, Viewport } from 'next';
import './globals.css';
import AnimatedBackground from '@/components/AnimatedBackground';
import SecurityProtection from '@/components/SecurityProtection';

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'RafaelXD - Free File Hosting & Url Shortener',
  description: 'Hosting dan bagikan file tanpa batas dan perpendek tautan kamu untuk memudahkan produktivitas.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo-icon.svg' },
    ],
    shortcut: '/favicon.svg',
    apple: '/logo-icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/logo-icon.svg" />
        <link rel="apple-touch-icon" href="/logo-icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-zinc-950 bg-grid-pattern text-zinc-100 font-['Outfit',sans-serif] antialiased selection:bg-zinc-800 selection:text-zinc-100 min-h-screen flex flex-col relative"
      >
        <AnimatedBackground />
        <SecurityProtection />
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

