import type { Metadata } from 'next'
import { Providers } from './providers'
import { getHomePageSEO, generateMetadata } from '@/lib/seo'
import './globals.css'

const seoConfig = getHomePageSEO();

export const metadata: Metadata = {
  ...generateMetadata(seoConfig),
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://audit.cfg.ninja'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seoConfig.jsonLd),
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
