"use client"

import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { MarketStatus } from "@/components/market-status"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import AboutPage from "@/app/about/page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, BarChart3, Activity, ArrowRight, Sparkles, Zap, Globe } from "lucide-react"
import { formatCurrency } from "@/lib/market-utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const StockList = dynamic(() => import("@/components/stock-list").then(mod => ({ default: mod.StockList })), {
  loading: () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-24 bg-secondary/30 rounded-xl shimmer" />
      ))}
    </div>
  ),
  ssr: true
})

const NewsSection = dynamic(() => import("@/components/news-section").then(mod => ({ default: mod.NewsSection })), {
  loading: () => null,
  ssr: false
})

const GainersLosers = dynamic(() => import("@/components/gainers-losers").then(mod => ({ default: mod.GainersLosers })), {
  loading: () => <div className="h-32 bg-secondary/30 rounded-xl shimmer" />
})

const FiftyTwoWeekView = dynamic(() => import("@/components/52-week-view").then(mod => ({ default: mod.FiftyTwoWeekView })), {
  loading: () => <div className="h-32 bg-secondary/30 rounded-xl shimmer" />
})

// Animated particles component
function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  )
}

// Animated counter component
function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])
  
  return <span>{prefix}{formatCurrency(displayValue)}</span>
}

export default function HomePage() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (user) {
      import("@/lib/cache-utils").then(({ preloadCommonStocks }) => {
        preloadCommonStocks()
      })
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="glow-orb glow-orb-cyan w-96 h-96 -top-48 -right-48" />
        <div className="glow-orb glow-orb-purple w-80 h-80 -bottom-40 -left-40" />
        
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-primary/30 rounded-full" />
            <div className="absolute inset-0 h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-xl font-semibold text-foreground animate-pulse">Loading Dashboard</p>
            <p className="text-sm text-muted-foreground">Fetching market data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AboutPage />
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 z-0" />
      <Particles />
      
      {/* Glow Orbs */}
      <div className="glow-orb glow-orb-cyan w-[500px] h-[500px] -top-64 -right-64 z-0" />
      <div className="glow-orb glow-orb-green w-[400px] h-[400px] top-1/2 -left-48 z-0" />
      <div className="glow-orb glow-orb-purple w-[350px] h-[350px] -bottom-32 right-1/4 z-0" />

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-3 py-6 md:px-4 md:py-8">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-fade-in-down">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Live Dashboard</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                Welcome back, <span className="text-gradient neon-text">{user.name?.split(' ')[0] || 'Trader'}</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Track your investments and discover market opportunities
              </p>
            </div>
            <div className="flex items-center gap-4">
              <MarketStatus />
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Balance Card */}
            <div className="animate-fade-in-up delay-100">
              <Card className="glass-card card-shine border-0 overflow-hidden group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wide">Balance</p>
                      </div>
                      <p className="text-xl md:text-3xl font-bold font-mono text-primary neon-text">
                        <AnimatedNumber value={user.balance} />
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Card */}
            <Link href="/portfolio" className="block animate-fade-in-up delay-200">
              <Card className="glass-card card-shine border-0 overflow-hidden h-full group cursor-pointer">
                <CardContent className="p-5 h-full">
                  <div className="flex items-start justify-between h-full">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#00ff88]" />
                        <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wide">Portfolio</p>
                      </div>
                      <p className="text-xl md:text-2xl font-bold group-hover:text-[#00ff88] transition-colors">
                        View Holdings
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#00ff88]/20 to-[#00ff88]/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <ArrowRight className="h-6 w-6 text-[#00ff88] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Options Card */}
            <Link href="/options" className="block animate-fade-in-up delay-300">
              <Card className="glass-card card-shine border-0 overflow-hidden h-full group cursor-pointer">
                <CardContent className="p-5 h-full">
                  <div className="flex items-start justify-between h-full">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-[#ffd700]" />
                        <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wide">Options</p>
                      </div>
                      <p className="text-xl md:text-2xl font-bold group-hover:text-[#ffd700] transition-colors">
                        NIFTY & More
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#ffd700]/20 to-[#ffd700]/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Globe className="h-6 w-6 text-[#ffd700]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* AI Predictions Card */}
            <Link href="/predictions" className="block animate-fade-in-up delay-400">
              <Card className="glass-card card-shine border-0 overflow-hidden h-full group cursor-pointer relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-5 h-full relative">
                  <div className="flex items-start justify-between h-full">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wide">AI Powered</p>
                      </div>
                      <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Predictions
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-pulse-glow">
                      <Activity className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column - Stocks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stock List */}
              <div className="animate-fade-in-up delay-500">
                <Card className="glass-card-no-hover border-0 overflow-hidden">
                  <CardHeader className="pb-0 border-b border-border/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="status-live" />
                        <CardTitle className="text-lg font-semibold">Popular Stocks</CardTitle>
                      </div>
                      <Link href="/52-week-highs-lows">
                        <Button variant="ghost" size="sm" className="text-xs gap-2 text-muted-foreground hover:text-primary group">
                          View All 
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <StockList />
                </Card>
              </div>

              {/* Gainers & Losers */}
              <div className="animate-fade-in-up delay-600">
                <GainersLosers />
              </div>

              {/* 52 Week High/Low */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-700">
                <FiftyTwoWeekView 
                  type="near-high" 
                  title="Near 52-Week Highs" 
                  description="Stocks near their yearly highs" 
                  limit={5} 
                />
                <FiftyTwoWeekView 
                  type="near-low" 
                  title="Near 52-Week Lows" 
                  description="Stocks near their yearly lows" 
                  limit={5} 
                />
              </div>
            </div>

            {/* Sidebar - News */}
            <div className="space-y-6 animate-fade-in-right delay-500">
              <Card className="glass-card-no-hover border-0 overflow-hidden">
                <CardHeader className="border-b border-border/30 bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />
                    <CardTitle className="text-lg font-semibold">Market News</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <NewsSection limit={8} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
