import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { PredictionProvider } from "@/contexts/prediction-context"
import { Toaster } from "@/components/ui/toaster"
import StartupRedirect from "@/components/startup-redirect"
import LoginModal from "@/components/login-modal"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Hritik Stocks - Premium Indian Stock Trading Platform",
  description: "Trade Indian NSE stocks with real-time data, professional charts, AI-powered predictions, options trading, and portfolio management. Start with Rs. 10 Lakh virtual balance.",
  keywords: ["stock trading", "NSE", "Indian stocks", "paper trading", "virtual trading", "stock market", "options trading", "AI predictions"],
  authors: [{ name: "Hritik Stocks" }],
  generator: "v0.app",
  openGraph: {
    title: "Hritik Stocks - Premium Indian Stock Trading Platform",
    description: "Trade Indian NSE stocks with real-time data and AI-powered predictions",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hritik Stocks - Premium Indian Stock Trading Platform",
    description: "Trade Indian NSE stocks with real-time data and AI-powered predictions",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a1625",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
            <AuthProvider>
              <PredictionProvider>
                <StartupRedirect />
                {children}
                <LoginModal />
                <Toaster />
              </PredictionProvider>
            </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
