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
          
          // If user came from payment success, log it
          if (searchParams.get('from') === 'payment' || searchParams.get('success') === 'paid') {
            console.log('✅ User redirected from successful payment')
          }
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
  }, [user, isLoading, searchParams])

  // Block rendering while checking payment
  if (isLoading || !authReady || verifiedPaymentStatus === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Verifying payment status...</p>
          {searchParams.get('from') === 'payment' && (
            <p className="text-primary text-sm font-semibold">Processing your payment...</p>
          )}
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
        {/* ABSOLUTE GATE: Show stocks ONLY if verifiedPaymentStatus === true */}
        {verifiedPaymentStatus === true ? (
          // ✅ PAID USER - Show all predictions
          <>
            <PredictionsHero />
            <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
              <div className="flex-1">
                <PredictionsList />
              </div>
              <div className="w-full lg:w-80 space-y-4 md:space-y-8">
                <NewsSection limit={8} />
              </div>
            </div>
          </>
        ) : (
          // 🔒 UNPAID USER - FULL PAGE PAYMENT SECTION
          <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-8">
            <div className="w-full max-w-3xl">
              {/* Payment Header */}
              <div className="text-center mb-10 space-y-4 animate-fade-in-up">
                <h1 className="text-4xl md:text-5xl font-extrabold">
                  🔮 Access Premium Stock Predictions
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Get access to high-quality stock predictions backed by strong fundamentals and real market strength — at a price that's almost unbelievable.
                </p>
              </div>

              {/* Main Payment Box */}
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/40 rounded-2xl p-8 md:p-12 mb-8 animate-bounce-slow">
                {/* Price Section */}
                <div className="text-center mb-8">
                  <p className="text-sm md:text-base text-muted-foreground mb-4 font-medium tracking-widest uppercase">🎯 SPECIAL LIFETIME OFFER</p>
                  <h2 className="text-6xl md:text-7xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Just ₹100
                  </h2>
                  <ul className="space-y-4 text-base md:text-lg text-foreground font-semibold max-w-md mx-auto">
                    <li className="flex items-center justify-center gap-3">
                      <span className="text-2xl">✓</span>
                      <span>Pay only once</span>
                    </li>
                    <li className="flex items-center justify-center gap-3">
                      <span className="text-2xl">✓</span>
                      <span>No monthly fees</span>
                    </li>
                    <li className="flex items-center justify-center gap-3">
                      <span className="text-2xl">✓</span>
                      <span>No hidden charges</span>
                    </li>
                    <li className="flex items-center justify-center gap-3">
                      <span className="text-2xl">✓</span>
                      <span>Lifetime access forever</span>
                    </li>
                  </ul>
                </div>

                {/* Features Section */}
                <div className="border-t border-primary/30 pt-8 mb-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">🚀 What You Get</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-lg p-4 space-y-2">
                      <p className="font-bold text-lg">✅ Strong Fundamental Stocks</p>
                      <p className="text-sm text-muted-foreground">Only fundamentally strong, high-quality companies with solid business strength.</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 space-y-2">
                      <p className="font-bold text-lg">✅ High-Potential Focus</p>
                      <p className="text-sm text-muted-foreground">Stocks with strong momentum and real profit potential. Weak stocks automatically removed.</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 space-y-2">
                      <p className="font-bold text-lg">✅ Live Market Updates</p>
                      <p className="text-sm text-muted-foreground">Predictions update dynamically according to current market conditions.</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 space-y-2">
                      <p className="font-bold text-lg">✅ 5-20% Stock Growth</p>
                      <p className="text-sm text-muted-foreground">Carefully curated stocks with real potential for 5-20% growth.</p>
                    </div>
                  </div>
                </div>

                {/* Stock Growth Highlight */}
                <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-500/60 rounded-xl p-6 text-center mb-8">
                  <p className="text-3xl mb-3">📈</p>
                  <p className="text-2xl font-bold text-green-400 mb-2">You Get 5% to 20% Stock Growth</p>
                  <p className="text-muted-foreground">Predictions focus on stocks with real potential based on fundamental strength and market momentum.</p>
                </div>

                {/* Coverage */}
                <div className="text-center mb-8">
                  <p className="font-semibold mb-2">✓ Covers Top NSE & BSE Stocks</p>
                  <p className="text-sm text-muted-foreground">Handpicked stocks from major sectors across NSE and BSE.</p>
                </div>
              </div>

              {/* Action Buttons - Large and Prominent */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-8 py-4 rounded-xl border-2 border-muted-foreground hover:border-foreground hover:bg-muted/50 transition font-bold text-lg text-foreground"
                >
                  ✕ Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/predictions/create-payment', { method: 'POST' })
                      const data = await res.json()
                      if (data.paymentLink) {
                        const paymentWindow = window.open(data.paymentLink, '_blank', 'width=500,height=700')
                        const checkPayment = setInterval(async () => {
                          if (paymentWindow && paymentWindow.closed) {
                            clearInterval(checkPayment)
                            // Wait 2 seconds for webhook to process, then verify payment
                            setTimeout(async () => {
                              try {
                                console.log('🔍 Checking payment status after payment window closed...')
                                const verifyRes = await fetch('/api/auth/me', { cache: 'no-store' })
                                if (verifyRes.ok) {
                                  const verifyData = await verifyRes.json()
                                  if (verifyData?.user?.isPredictionPaid === true) {
                                    console.log('✅ Payment verified! Redirecting to predictions...')
                                    // Payment confirmed, redirect to show predictions
                                    window.location.href = '/predictions?from=payment&success=true'
                                  } else {
                                    console.log('⏳ Payment still processing, waiting...')
                                    // Still processing, wait a bit more
                                    setTimeout(() => {
                                      window.location.href = '/predictions?from=payment&checking=true'
                                    }, 2000)
                                  }
                                } else {
                                  window.location.href = '/predictions?from=payment&checking=true'
                                }
                              } catch (err) {
                                console.error('Error verifying payment:', err)
                                window.location.href = '/predictions?from=payment&checking=true'
                              }
                            }, 2000)
                          }
                        }, 1000)
                      } else {
                        alert(data.error || 'Failed to create payment')
                      }
                    } catch (err) {
                      console.error('Error creating payment:', err)
                      alert('Error starting payment')
                    }
                  }}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:scale-105 transition font-bold text-lg text-white shadow-lg"
                >
                  💳 Access to Pay
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  💡 <span className="font-semibold">Secure Payment:</span> Payments processed securely by Razorpay. No data stored on our servers.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
