"use client"

import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { MarketStatus } from "@/components/market-status"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AboutPage from "@/app/about/page"
import { Wallet, TrendingUp, BarChart3, Briefcase } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/market-utils"

// Dynamic imports with loading states
const StockList = dynamic(() => import("@/components/stock-list").then(mod => ({ default: mod.StockList })), {
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
      ))}
    </div>
  ),
  ssr: true
})

const NewsSection = dynamic(() => import("@/components/news-section").then(mod => ({ default: mod.NewsSection })), {
  loading: () => <div className="h-40 bg-secondary/30 rounded-xl animate-pulse" />,
  ssr: false
})

const GainersLosers = dynamic(() => import("@/components/gainers-losers").then(mod => ({ default: mod.GainersLosers })), {
  loading: () => <div className="h-32 bg-secondary/30 rounded-xl animate-pulse" />
})

const FiftyTwoWeekView = dynamic(() => import("@/components/52-week-view").then(mod => ({ default: mod.FiftyTwoWeekView })), {
  loading: () => <div className="h-32 bg-secondary/30 rounded-xl animate-pulse" />
})

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      import("@/lib/cache-utils").then(({ preloadCommonStocks }) => {
        preloadCommonStocks()
      })
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AboutPage />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {user.name?.split(' ')[0] || 'Trader'}
            </h1>
            <p className="text-muted-foreground mt-1">Here is your market overview for today</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Balance:</span>
              <span className="text-base font-bold font-mono text-primary">{formatCurrency(user.balance)}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase">Market</span>
              <MarketStatus />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/portfolio" className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
              <Briefcase className="h-5 w-5 text-blue-500" />
            </div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Portfolio</p>
            <p className="text-sm text-muted-foreground">View holdings</p>
          </Link>
          
          <Link href="/options" className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
              <BarChart3 className="h-5 w-5 text-cyan-500" />
            </div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Options</p>
            <p className="text-sm text-muted-foreground">Trade F&O</p>
          </Link>
          
          <Link href="/predictions" className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Predictions</p>
            <p className="text-sm text-muted-foreground">AI forecasts</p>
          </Link>
          
          <Link href="/about" className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
              <Wallet className="h-5 w-5 text-green-500" />
            </div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">About</p>
            <p className="text-sm text-muted-foreground">Learn more</p>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Stock List */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Popular Stocks</h2>
                <p className="text-sm text-muted-foreground">Click on any stock to trade</p>
              </div>
              <StockList />
            </div>

            {/* Gainers & Losers */}
            <GainersLosers />

            {/* 52-Week Highs */}
            <FiftyTwoWeekView type="near-high" title="52-Week Highs" description="Stocks near their 52-week highs" limit={20} />

            {/* 52-Week Lows */}
            <FiftyTwoWeekView type="near-low" title="52-Week Lows" description="Stocks near their 52-week lows" limit={10} />
          </div>

          {/* Sidebar with News */}
          <div className="w-full lg:w-80">
            <div className="rounded-xl border border-border bg-card overflow-hidden sticky top-20">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Market News</h2>
              </div>
              <div className="p-4">
                <NewsSection limit={10} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
