"use client"

import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { MarketStatus } from "@/components/market-status"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AboutPage from "@/app/about/page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, BarChart3, Activity, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/market-utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const StockList = dynamic(() => import("@/components/stock-list").then(mod => ({ default: mod.StockList })), {
  loading: () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-24 bg-secondary/30 rounded-xl animate-pulse" />
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
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AboutPage />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 py-4 md:px-4 md:py-6">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, <span className="text-gradient">{user.name?.split(' ')[0] || 'Trader'}</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Track your investments and discover opportunities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MarketStatus />
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="glass-card border-border/30 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-lg md:text-2xl font-bold font-mono text-primary">
                    {formatCurrency(user.balance)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Link href="/portfolio" className="block">
            <Card className="glass-card border-border/30 overflow-hidden hover:border-primary/30 transition-colors h-full">
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Portfolio</p>
                    <p className="text-lg md:text-2xl font-bold">View All</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/options" className="block">
            <Card className="glass-card border-border/30 overflow-hidden hover:border-primary/30 transition-colors h-full">
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Options Trading</p>
                    <p className="text-lg md:text-2xl font-bold">NIFTY & More</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/predictions" className="block">
            <Card className="glass-card border-border/30 overflow-hidden hover:border-primary/30 transition-colors h-full relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-4 h-full flex flex-col justify-between relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">AI Predictions</p>
                    <p className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Premium
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-purple-400" />
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
            <Card className="border-border/30 overflow-hidden">
              <CardHeader className="pb-0 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Popular Stocks</CardTitle>
                  <Link href="/52-week-highs-lows">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                      View All <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <StockList />
            </Card>

            {/* Gainers & Losers */}
            <GainersLosers />

            {/* 52 Week High/Low */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="space-y-6">
            <Card className="border-border/30 overflow-hidden">
              <CardHeader className="border-b border-border/30 bg-gradient-to-r from-accent/5 to-transparent">
                <CardTitle className="text-lg font-semibold">Market News</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <NewsSection limit={8} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
