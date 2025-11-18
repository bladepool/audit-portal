import type { Metadata } from 'next'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import './globals.css'

export const metadata: Metadata = {
  title: 'CFG Ninja Audit Portal',
  description: 'Smart contract audit platform for blockchain networks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <FluentProvider theme={webLightTheme}>
          {children}
        </FluentProvider>
      </body>
    </html>
  )
}
