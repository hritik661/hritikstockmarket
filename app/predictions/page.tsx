"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { IndicesTicker } from "@/components/indices-ticker"
import { PredictionsList } from "@/components/predictions-list"
import PredictionsHero from "@/components/predictions-hero"
import { NewsSection } from "@/components/news-section"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles, Lock } from "lucide-react"

export default function PredictionsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authReady, setAuthReady] = useState(false)
  const [verifiedPaymentStatus, setVerifiedPaymentStatus] = useState<boolean | null>(null)

  // CRITICAL: Block rendering until payment status is verified from server
  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (isLoading) return // Wait for auth context to load first

      if (!user) {
        setVerifiedPaymentStatus(null) // Not logged in
        setAuthReady(true)
        return
      }

      try {
        console.log('🔍 Verifying payment status from server...')
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        
        if (res.ok) {
          const data = await res.json()
          const paid = data?.user?.isPredictionPaid === true
          console.log('✅ Payment verified from server:', paid)
          setVerifiedPaymentStatus(paid)
        } else {
          console.error('❌ Could not verify payment from server')
          setVerifiedPaymentStatus(false)
        }
      } catch (err) {
        console.error('❌ Payment verification error:', err)
        setVerifiedPaymentStatus(false)
      } finally {
        setAuthReady(true)
      }
    }

    verifyPaymentStatus()
  }, [user, isLoading])

  // Block rendering while checking payment
  if (isLoading || !authReady || verifiedPaymentStatus === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Verifying payment status...</p>
        </div>
      </div>
    )
  }

  // Not logged in - show login prompt
  if (!user || verifiedPaymentStatus === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="hidden md:block">
          <IndicesTicker />
        </div>

        <main className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-xl mx-auto">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Stock Predictions</h1>
            <p className="text-muted-foreground mb-6">Please sign in to view AI-powered predictions.</p>
            <div className="flex justify-center gap-4">
              <Button asChild className="rounded-xl">
                <Link href="/login?callbackUrl=/predictions">Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl bg-transparent">
                <Link href="/">Back Home</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // MAIN RENDERING LOGIC - PAYMENT GATE
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="hidden md:block">
        <IndicesTicker />
      </div>

      <main className="container mx-auto px-3 py-4 md:px-4 md:py-8">
        {/* ALWAYS show hero for signed-in users */}
        <PredictionsHero />

        {/* ABSOLUTE GATE: Show stocks ONLY if verifiedPaymentStatus === true */}
        {verifiedPaymentStatus === true ? (
          // ✅ PAID USER - Show all predictions
          <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
            <div className="flex-1">
              <PredictionsList />
            </div>
            <div className="w-full lg:w-80 space-y-4 md:space-y-8">
              <NewsSection limit={8} />
            </div>
          </div>
        ) : (
          // 🔒 UNPAID USER - LOCKED SECTION (show this for ANY unpaid state)
          <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
            <div className="flex-1">
              <div className="rounded-xl border-2 border-red-500/50 bg-red-500/5 p-8 md:p-16 text-center min-h-[500px] flex flex-col items-center justify-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500">
                  <Lock className="h-10 w-10 text-red-500" />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-4xl font-bold text-red-500">🔒 ALL STOCKS LOCKED</h2>
                  <p className="text-xl text-foreground font-semibold">Payment Required to View Predictions</p>
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 space-y-3 max-w-md text-left">
                  <p className="text-sm text-muted-foreground">
                    ✗ All 1000+ stock predictions are <span className="font-bold text-red-500">HIDDEN</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ✗ Charts and analysis are <span className="font-bold text-red-500">BLOCKED</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ✗ Buy/Sell buttons are <span className="font-bold text-red-500">DISABLED</span>
                  </p>
                </div>

                <div className="text-center space-y-2 bg-green-500/10 border border-green-500/30 rounded-lg p-6 max-w-md">
                  <p className="text-green-500 font-bold text-lg">✓ UNLOCK FOR JUST ₹100</p>
                  <p className="text-sm text-muted-foreground">Click "Access Predictions (Pay to Continue)" above</p>
                  <p className="text-xs text-muted-foreground mt-2">Lifetime access • No recurring charges • Instant access</p>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-80 space-y-4 md:space-y-8">
              <NewsSection limit={8} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
