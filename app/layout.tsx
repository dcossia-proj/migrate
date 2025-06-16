import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Greysale",
  description: "Order submission platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* iOS 26 Liquid Glass compatibility */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Greysale" />

        {/* Enhanced theme colors for iOS 26 */}
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1a1a1a" />
        <meta name="msapplication-navbutton-color" content="#1a1a1a" />

        {/* iOS 26 specific viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* iOS 26 Liquid Glass specific */}
        <meta name="apple-mobile-web-app-appearance" content="translucent" />
        <meta name="supported-color-schemes" content="dark" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
