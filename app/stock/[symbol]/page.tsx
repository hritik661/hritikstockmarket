"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { LogoImage } from "@/components/logo-image"
import { StockChart } from "@/components/stock-chart"
import { CandlestickChart } from "@/components/candlestick-chart"
import { TradePanel } from "@/components/trade-panel"
import { OptionChain } from "@/components/option-chain"
import { NewsSection } from "@/components/news-section"
import { MarketStatus } from "@/components/market-status"
import { fetchStockQuote, fetchChartData, type StockQuote, type ChartData } from "@/lib/yahoo-finance"
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/market-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, ArrowLeft, BarChart3, Activity, RefreshCw, Clock, DollarSign, Volume2, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TIME_RANGES = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "MAX"]
const INDIAN_INDICES = ["NIFTY.NS", "BANKNIFTY.NS", "SENSEX.BO"]

// Animated particles
function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${12 + Math.random() * 8}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = decodeURIComponent(params.symbol as string)

  if (!symbol || symbol.trim() === '') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 bg-grid-pattern opacity-20 z-0" />
        <div className="glow-orb glow-orb-cyan w-[400px] h-[400px] -top-32 -right-32 z-0" />
        <Header />
        <main className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
            <div className="h-20 w-20 rounded-3xl bg-[#ff3333]/10 flex items-center justify-center mb-6">
              <TrendingDown className="h-10 w-10 text-[#ff3333]" />
            </div>
            <p className="text-2xl font-bold mb-2">Invalid Symbol</p>
            <p className="text-muted-foreground mb-6">The stock symbol you entered is not valid</p>
            <Button onClick={() => router.back()} className="btn-primary-glow rounded-xl px-8 h-12">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const [stock, setStock] = useState<StockQuote | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [currentRange, setCurrentRange] = useState("1W")
  const [activeTab, setActiveTab] = useState("candlestick")
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isIndex = INDIAN_INDICES.includes(symbol)

  const [preselectedOption, setPreselectedOption] = useState<
    | { action: "BUY" | "SELL"; type: 'CE' | 'PE'; strike: number; price: number }
    | null
  >(null)
  const [tradeInitialTab, setTradeInitialTab] = useState<"buy" | "sell">("buy")

  const handleOptionTrade = (action: "BUY" | "SELL", type: "CE" | "PE", strike: number, price: number) => {
    setPreselectedOption({ action, type, strike, price })
    try {
      const el = document.getElementById('trade-panel')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch (e) {}
  }

  const handleStockTrade = (action: "BUY" | "SELL", price: number) => {
    setTradeInitialTab(action.toLowerCase() as "buy" | "sell")
    setPreselectedOption(null)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [quoteData, chartDataResult] = await Promise.all([
          fetchStockQuote(symbol),
          fetchChartData(symbol, currentRange),
        ])

        if (!quoteData) {
          setError("Stock not found or not supported. Please check the symbol and try again.")
        } else {
          setStock(quoteData)
          setChartData(chartDataResult)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError("Failed to load stock data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const interval = setInterval(async () => {
      try {
        const quoteData = await fetchStockQuote(symbol)
        if (quoteData) setStock(quoteData)
      } catch (err) {
        console.error('Error updating quote:', err)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [symbol, currentRange])

  const handleRangeChange = async (range: string) => {
    setCurrentRange(range)
    setChartLoading(true)
    try {
      const data = await fetchChartData(symbol, range)
      setChartData(data)
    } catch (err) {
      console.error('Error changing range:', err)
    } finally {
      setChartLoading(false)
    }
  }

  const handleRefresh = async () => {
    setChartLoading(true)
    const [quoteData, chartDataResult] = await Promise.all([
      fetchStockQuote(symbol),
      fetchChartData(symbol, currentRange),
    ])
    if (quoteData) setStock(quoteData)
    setChartData(chartDataResult)
    setChartLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 bg-grid-pattern opacity-20 z-0" />
        <Particles />
        <div className="glow-orb glow-orb-cyan w-[500px] h-[500px] -top-48 -right-48 z-0" />
        <div className="glow-orb glow-orb-purple w-[400px] h-[400px] bottom-0 -left-32 z-0" />
        
        <div className="relative z-10">
          <Header />
          <main className="container mx-auto px-4 py-6">
            <div className="h-10 w-48 bg-secondary/30 rounded-xl shimmer mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-[500px] glass-card rounded-3xl shimmer" />
                <div className="h-64 glass-card rounded-3xl shimmer" />
              </div>
              <div className="space-y-6">
                <div className="h-80 glass-card rounded-3xl shimmer" />
                <div className="h-96 glass-card rounded-3xl shimmer" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 bg-grid-pattern opacity-20 z-0" />
        <div className="glow-orb glow-orb-purple w-[400px] h-[400px] top-1/4 -right-32 z-0" />
        <Header />
        <main className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
            <div className="h-20 w-20 rounded-3xl bg-[#ff3333]/10 flex items-center justify-center mb-6 neon-glow-red">
              <TrendingDown className="h-10 w-10 text-[#ff3333]" />
            </div>
            <p className="text-2xl font-bold mb-2">Error Loading Stock</p>
            <p className="text-muted-foreground mb-6 text-center max-w-md">{error || "Stock not found"}</p>
            <Button onClick={() => router.back()} className="btn-primary-glow rounded-xl px-8 h-12">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const isPositive = stock.regularMarketChange >= 0

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 z-0" />
      <Particles />
      
      {/* Glow Orbs */}
      <div className={cn(
        "glow-orb w-[600px] h-[600px] -top-64 -right-64 z-0",
        isPositive ? "glow-orb-green" : "glow-orb-purple"
      )} />
      <div className="glow-orb glow-orb-cyan w-[400px] h-[400px] bottom-0 -left-32 z-0" />

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-3 py-4 md:px-4 md:py-6">
          {/* Stock Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 animate-fade-in-down">
            <div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mb-4 -ml-2 text-muted-foreground hover:text-primary group rounded-xl" 
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <LogoImage 
                    symbol={stock.symbol} 
                    name={stock.longName || stock.shortName} 
                    size={72} 
                    className="h-16 w-16 md:h-[72px] md:w-[72px] rounded-2xl flex-shrink-0 object-cover border-2 border-border/30" 
                  />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center",
                    isPositive ? "bg-[#00ff88]" : "bg-[#ff3333]"
                  )}>
                    {isPositive ? <TrendingUp className="h-3 w-3 text-black" /> : <TrendingDown className="h-3 w-3 text-white" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold">{symbol.replace(".NS", "").replace(".BO", "")}</h1>
                    <Badge variant="secondary" className="font-mono text-xs px-3 py-1 rounded-lg bg-secondary/50">
                      {stock.currency}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-xl hover:bg-primary/10" 
                      onClick={handleRefresh}
                    >
                      <RefreshCw className={cn("h-4 w-4", chartLoading && "animate-spin")} />
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{stock.longName || stock.shortName}</p>
                </div>
              </div>

              {/* Price Display */}
              <div className="flex flex-wrap items-baseline gap-4 animate-fade-in-up delay-200">
                <span className={cn(
                  "text-5xl md:text-6xl font-bold font-mono tracking-tight",
                  isPositive ? "text-[#00ff88] neon-text-green" : "text-[#ff3333] neon-text-red"
                )}>
                  {formatCurrency(stock.regularMarketPrice)}
                </span>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold",
                  isPositive 
                    ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20" 
                    : "bg-[#ff3333]/10 text-[#ff3333] border border-[#ff3333]/20"
                )}>
                  {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="text-lg">
                    {isPositive ? "+" : ""}{formatCurrency(stock.regularMarketChange).replace("", "")}
                  </span>
                  <span className="text-lg">
                    ({formatPercentage(stock.regularMarketChangePercent)})
                  </span>
                </div>
              </div>
            </div>

            <div className="animate-fade-in-right delay-300">
              <MarketStatus />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Chart Card */}
              <Card className="glass-card border-0 overflow-hidden animate-fade-in-up delay-300">
                <CardContent className="p-4 md:p-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <TabsList className="bg-secondary/50 p-1.5 rounded-2xl">
                        <TabsTrigger
                          value="line"
                          className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-lg gap-2 px-4 py-2 font-semibold transition-all"
                        >
                          <Activity className="h-4 w-4" />
                          Line
                        </TabsTrigger>
                        <TabsTrigger
                          value="candlestick"
                          className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-lg gap-2 px-4 py-2 font-semibold transition-all"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Candlestick
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex gap-1 flex-wrap bg-secondary/30 p-1 rounded-xl">
                        {TIME_RANGES.map((range) => (
                          <Button
                            key={range}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRangeChange(range)}
                            disabled={chartLoading}
                            className={cn(
                              "text-xs font-semibold px-3 h-8 rounded-lg transition-all",
                              currentRange === range
                                ? "bg-primary text-black neon-glow"
                                : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {range}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {chartLoading ? (
                      <div className="h-[400px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <div className="h-14 w-14 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 h-14 w-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                          <p className="text-sm text-muted-foreground">Loading chart...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <TabsContent value="line" className="mt-0">
                          <StockChart
                            data={chartData}
                            onRangeChange={handleRangeChange}
                            currentRange={currentRange}
                            isPositive={isPositive}
                            hideControls
                          />
                        </TabsContent>
                        <TabsContent value="candlestick" className="mt-0">
                          <CandlestickChart data={chartData} currentRange={currentRange} />
                        </TabsContent>
                      </>
                    )}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Trade Panel */}
              <div id="trade-panel" className="animate-fade-in-up delay-400">
                {symbol !== "BTC-USD" && symbol !== "BTC-INR" && (
                  <TradePanel 
                    stock={stock} 
                    preselectedOption={preselectedOption} 
                    initialTab={tradeInitialTab} 
                  />
                )}
              </div>

              {/* Key Statistics */}
              <Card className="glass-card border-0 animate-fade-in-up delay-500">
                <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-r from-primary/10 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold">Key Statistics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 md:p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
                    {[
                      { label: "Open", value: formatCurrency(stock.regularMarketOpen), icon: Clock, color: "primary" },
                      { label: "Prev Close", value: formatCurrency(stock.regularMarketPreviousClose), icon: DollarSign, color: "muted-foreground" },
                      { label: "Day High", value: formatCurrency(stock.regularMarketDayHigh), icon: TrendingUp, color: "[#00ff88]" },
                      { label: "Day Low", value: formatCurrency(stock.regularMarketDayLow), icon: TrendingDown, color: "[#ff3333]" },
                      { label: "52W High", value: formatCurrency(stock.fiftyTwoWeekHigh), icon: Target, color: "[#00ff88]" },
                      { label: "52W Low", value: formatCurrency(stock.fiftyTwoWeekLow), icon: Target, color: "[#ff3333]" },
                      { label: "Volume", value: formatNumber(stock.regularMarketVolume), icon: Volume2, color: "primary" },
                      { label: "Market Cap", value: stock.marketCap ? `${(stock.marketCap / 10000000).toFixed(2)} Cr` : "N/A", icon: BarChart3, color: "[#ffd700]" },
                    ].map((stat, i) => (
                      <div key={i} className="glass-card-no-hover p-4 rounded-2xl space-y-2 hover-lift">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <stat.icon className={cn("h-3.5 w-3.5", `text-${stat.color}`)} />
                          {stat.label}
                        </p>
                        <p className={cn(
                          "font-mono font-bold text-base md:text-lg",
                          stat.color !== "muted-foreground" && `text-${stat.color}`
                        )}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Option Chain for Indices */}
              {isIndex && stock && (
                <div className="animate-fade-in-up delay-600">
                  <OptionChain
                    stockPrice={stock.regularMarketPrice}
                    symbol={symbol}
                    onTrade={handleOptionTrade}
                    onStockTrade={handleStockTrade}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6 animate-fade-in-right delay-400">
              <Card className="glass-card border-0 overflow-hidden">
                <CardHeader className="border-b border-border/30 bg-gradient-to-r from-[#00ff88]/10 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="status-live" />
                    <CardTitle className="text-lg font-semibold">Related News</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <NewsSection stockSymbol={symbol} limit={6} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
