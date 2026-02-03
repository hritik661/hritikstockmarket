"use client"

import { Sparkles, TrendingUp, Brain, Zap, X, Check } from "lucide-react"
import React, { useState } from 'react';
import { useAuth } from "@/contexts/auth-context"


const handlePredictionClick = async (showModal: (value: boolean) => void) => {
  // Show the unlock modal first
  showModal(true)
};

const handleConfirmPayment = async (
  closeModal: () => void,
  setShowSuccess: (value: boolean) => void,
  markPredictionsAsPaid?: () => void
) => {
  closeModal()

  try {
    const hasCookie = typeof document !== 'undefined' && document.cookie.includes('session_token=')
    if (!hasCookie) {
      alert('Please sign in to continue to payment.')
      return
    }

    const res = await fetch('/api/predictions/create-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const data = await res.json();
    if (data.paymentLink) {
      const paymentWindow = window.open(
        data.paymentLink,
        '_blank',
        'width=500,height=700'
      );

      const checkPayment = setInterval(async () => {
        if (paymentWindow && paymentWindow.closed) {
          clearInterval(checkPayment);
          // Call backend to verify payment status from your database
          try {
            const verifyRes = await fetch('/api/predictions/check-access')
            if (verifyRes.ok) {
              // Refresh user state via auth context if provided
              try {
                if (markPredictionsAsPaid) await markPredictionsAsPaid()
              } catch (e) {}
              setShowSuccess(true)
            } else {
              alert('Payment not verified. Please try again.');
            }
          } catch (e) {
            alert('Payment verification failed. Please refresh and check your access.');
          }
        }
      }, 2000);
    } else {
      alert(data.error || 'Failed to create payment.');
    }
  } catch (err) {
    alert('Error creating payment.');
  }
};


export default function PredictionsHero() {
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { markPredictionsAsPaid } = useAuth()

  // Auto-redirect after showing success message
  React.useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(async () => {
        try {
          if (markPredictionsAsPaid) await markPredictionsAsPaid()
        } catch (e) {
          // fallback: request /api/auth/me to refresh
          try { await fetch('/api/auth/me') } catch (err) {}
        }
        // Refresh the page to show predictions
        window.location.href = '/predictions?from=payment'
      }, 3000) // Show success message for 3 seconds then redirect
      
      return () => clearTimeout(timer)
    }
  }, [showSuccess, markPredictionsAsPaid])
  return (
    <div className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-2xl border border-primary/20 p-4 sm:p-6 md:p-12 lg:p-16 overflow-hidden mb-8 animate-fade-in-up max-w-4xl ml-0 md:ml-8">
      {/* Smaller background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-primary/10 rounded-full blur-2xl -mr-8 -mt-8 sm:-mr-24 sm:-mt-24 md:-mr-32 md:-mt-32 opacity-30" />
      <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-accent/10 rounded-full blur-2xl -ml-8 -mb-8 sm:-ml-24 sm:-mb-24 md:-ml-32 md:-mb-32 opacity-30" />

      <div className="relative z-10">
        {/* Smaller Header */}
        <div className="flex items-center gap-3 sm:gap-5 mb-4 sm:mb-6">
          <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
            <Zap className="h-6 w-6 sm:h-10 sm:w-10 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-foreground mb-1 sm:mb-2">AI-Powered Stock Predictions</h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-xs sm:max-w-xl">Advanced machine learning models analyzing real-time market data to predict stock movements with 85%+ accuracy</p>
          </div>
        </div>

        {/* Smaller Payment Button */}
        <div className="mb-4 sm:mb-6">
          <button
            className="bg-primary text-white px-4 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl font-bold shadow-lg hover:bg-primary/80 transition text-base sm:text-lg"
            onClick={() => handlePredictionClick(setShowModal)}
          >
            Access Predictions (Pay to Continue)
          </button>
        </div>

        {/* Payment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-4 sm:p-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 animate-pulse">
                  <span className="text-3xl">🔮</span> Access Premium Stock Predictions
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground hover:text-foreground transition p-1 hover:rotate-90"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Introduction */}
                <div className="animate-slide-in-up">
                  <p className="text-base sm:text-lg text-muted-foreground mb-4 font-semibold leading-relaxed">Get access to high-quality stock predictions backed by strong fundamentals and real market strength — at a price that's almost unbelievable.</p>
                </div>

                {/* Price Section */}
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/40 rounded-xl p-6 sm:p-8 text-center animate-bounce-slow">
                  <p className="text-sm text-muted-foreground mb-3 font-medium tracking-widest uppercase">💰 Special Lifetime Offer</p>
                  <h2 className="text-5xl sm:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Just ₹100</h2>
                  <ul className="space-y-3 text-base text-foreground font-medium">
                    <li className="animate-slide-in flex items-center justify-center gap-2" style={{ animationDelay: '0.1s' }}>
                      <span className="text-lg">✓</span>
                      <span>Pay only once</span>
                    </li>
                    <li className="animate-slide-in flex items-center justify-center gap-2" style={{ animationDelay: '0.2s' }}>
                      <span className="text-lg">✓</span>
                      <span>No monthly fees</span>
                    </li>
                    <li className="animate-slide-in flex items-center justify-center gap-2" style={{ animationDelay: '0.3s' }}>
                      <span className="text-lg">✓</span>
                      <span>No hidden charges</span>
                    </li>
                    <li className="animate-slide-in flex items-center justify-center gap-2" style={{ animationDelay: '0.4s' }}>
                      <span className="text-lg">✓</span>
                      <span>Lifetime access with a single payment</span>
                    </li>
                  </ul>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-xl font-bold mb-4">🚀 What You Get with Prediction Access</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3 animate-slide-in-left" style={{ animationDelay: '0.5s' }}>
                      <span className="text-lg">✅</span>
                      <div>
                        <p className="font-bold">Strong Fundamental Stocks Only</p>
                        <p className="text-sm text-muted-foreground">We show only fundamentally strong, high-quality companies with solid business strength.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 animate-slide-in-left" style={{ animationDelay: '0.6s' }}>
                      <span className="text-lg">✅</span>
                      <div>
                        <p className="font-bold">High-Potential & Profitable Focus</p>
                        <p className="text-sm text-muted-foreground">Predictions highlight stocks with strong momentum and real profit potential. Weak or negative stocks are automatically removed.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 animate-slide-in-left" style={{ animationDelay: '0.7s' }}>
                      <span className="text-lg">✅</span>
                      <div>
                        <p className="font-bold">Live Market-Driven Updates</p>
                        <p className="text-sm text-muted-foreground">Stock predictions update dynamically according to current market conditions.</p>
                      </div>
                    </div>

                    {/* Special Stock Growth Offer */}
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-4 animate-slide-in-left" style={{ animationDelay: '0.75s' }}>
                      <div className="flex gap-3">
                        <span className="text-2xl">📈</span>
                        <div className="flex-1">
                          <p className="font-bold text-lg text-green-400">You Get 5% to 20% Stock Growth</p>
                          <p className="text-sm text-muted-foreground mt-1">Our carefully curated predictions focus on stocks with real potential for 5-20% growth based on fundamental strength and market momentum.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 animate-slide-in-left" style={{ animationDelay: '0.8s' }}>
                      <span className="text-lg">✅</span>
                      <div>
                        <p className="font-bold">Covers Top NSE & BSE Stocks</p>
                        <p className="text-sm text-muted-foreground">Handpicked stocks from major sectors across NSE and BSE.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 sticky bottom-0 bg-card border-t border-border p-4 sm:p-6 -m-4 sm:-m-6 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-border hover:bg-muted/50 transition font-semibold text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmPayment(() => setShowModal(false), setShowSuccess, markPredictionsAsPaid)}
                    className="flex-1 px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition shadow-lg hover:shadow-xl hover:scale-105 text-base"
                  >
                    OK — Go to Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-card border-2 border-green-500/60 rounded-2xl max-w-xl w-full shadow-2xl animate-in zoom-in-95">
              <div className="p-8 sm:p-10 text-center space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center animate-bounce">
                    <Check className="h-10 w-10 text-green-500" />
                  </div>
                </div>

                {/* Success Message */}
                <div className="space-y-3 animate-slide-in-up">
                  <h2 className="text-4xl font-bold text-green-500">🎉 Payment Successful!</h2>
                  <p className="text-lg text-muted-foreground">Your payment was processed successfully.</p>
                </div>

                {/* Success Details */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 space-y-4 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="space-y-2">
                    <p className="font-bold text-foreground text-lg">🎉 Welcome to the Prediction Page!</p>
                    <p className="text-muted-foreground leading-relaxed">
                      You now have lifetime access to all stock prediction services.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Enjoy high-quality predictions based on strong fundamentals and market strength — forever.
                    </p>
                  </div>
                </div>

                {/* Loading indicator */}
                <div className="flex items-center justify-center gap-2 text-primary">
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  <span className="text-sm text-muted-foreground ml-2">Redirecting...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smaller Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[ 
            { icon: Brain, label: "AI Models", value: "50+" },
            { icon: TrendingUp, label: "Accuracy", value: "85%+" },
            { icon: Zap, label: "Updates", value: "Real-time" },
            { icon: Sparkles, label: "Coverage", value: "Nifty 50" },
          ].map((item, idx) => {
            const Icon = item.icon
            return (
              <div key={idx} className="glass-morphism rounded-xl sm:rounded-2xl p-3 sm:p-5 flex items-center gap-2 sm:gap-4">
                <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-tight">{item.label}</p>
                  <p className="font-bold text-sm sm:text-base md:text-lg text-gradient leading-tight">{item.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
