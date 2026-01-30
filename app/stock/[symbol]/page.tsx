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
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, ArrowLeft, BarChart3, Activity, RefreshCw, Clock, DollarSign, Volume2, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TIME_RANGES = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "MAX"]

const INDIAN_INDICES = ["NIFTY.NS", "BANKNIFTY.NS", "SENSEX.BO"]

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = decodeURIComponent(params.symbol as string)

  if (!symbol || symbol.trim() === '') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-xl text-muted-foreground mb-4">Invalid stock symbol</p>
            <Button onClick={() => router.back()}>Go Back</Button>
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[450px] rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-96 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-xl text-muted-foreground mb-4">{error || "Stock not found"}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </main>
      </div>
    )
  }

  const isPositive = stock.regularMarketChange >= 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 py-4 md:px-4 md:py-6">
        {/* Stock Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <LogoImage 
                symbol={stock.symbol} 
                name={stock.longName || stock.shortName} 
                size={56} 
                className="h-12 w-12 md:h-14 md:w-14 rounded-xl flex-shrink-0 object-cover border border-border/30" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{symbol.replace(".NS", "").replace(".BO", "")}</h1>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {stock.currency}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh}>
                    <RefreshCw className={cn("h-4 w-4", chartLoading && "animate-spin")} />
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm">{stock.longName || stock.shortName}</p>
              </div>
            </div>

            {/* Price Display */}
            <div className="flex flex-wrap items-baseline gap-3 mt-4">
              <span className="text-4xl md:text-5xl font-bold font-mono tracking-tight">
                {formatCurrency(stock.regularMarketPrice)}
              </span>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              )}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-semibold">
                  {isPositive ? "+" : ""}{formatCurrency(stock.regularMarketChange).replace("", "")}
                </span>
                <span className="font-semibold">
                  ({formatPercentage(stock.regularMarketChangePercent)})
                </span>
              </div>
            </div>
          </div>

          <MarketStatus />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart Card */}
            <Card className="border-border/30 overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-secondary/50 p-1 rounded-xl">
                      <TabsTrigger
                        value="line"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
                      >
                        <Activity className="h-4 w-4" />
                        Line
                      </TabsTrigger>
                      <TabsTrigger
                        value="candlestick"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Candlestick
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-1 flex-wrap">
                      {TIME_RANGES.map((range) => (
                        <Button
                          key={range}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRangeChange(range)}
                          disabled={chartLoading}
                          className={cn(
                            "text-xs font-medium px-3 h-8 rounded-lg transition-all",
                            currentRange === range
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "hover:bg-secondary",
                          )}
                        >
                          {range}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {chartLoading ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading chart data...</p>
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
            <div id="trade-panel">
              {symbol !== "BTC-USD" && symbol !== "BTC-INR" && (
                <TradePanel 
                  stock={stock} 
                  preselectedOption={preselectedOption} 
                  initialTab={tradeInitialTab} 
                />
              )}
            </div>

            {/* Key Statistics */}
            <Card className="border-border/30">
              <CardHeader className="pb-4 border-b border-border/30">
                <CardTitle className="text-lg font-semibold">Key Statistics</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { label: "Open", value: formatCurrency(stock.regularMarketOpen), icon: Clock },
                    { label: "Previous Close", value: formatCurrency(stock.regularMarketPreviousClose), icon: DollarSign },
                    { label: "Day High", value: formatCurrency(stock.regularMarketDayHigh), icon: TrendingUp, positive: true },
                    { label: "Day Low", value: formatCurrency(stock.regularMarketDayLow), icon: TrendingDown, negative: true },
                    { label: "52W High", value: formatCurrency(stock.fiftyTwoWeekHigh), icon: Target, positive: true },
                    { label: "52W Low", value: formatCurrency(stock.fiftyTwoWeekLow), icon: Target, negative: true },
                    { label: "Volume", value: formatNumber(stock.regularMarketVolume), icon: Volume2 },
                    { label: "Market Cap", value: stock.marketCap ? `${(stock.marketCap / 10000000).toFixed(2)} Cr` : "N/A", icon: BarChart3 },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <stat.icon className="h-3 w-3" />
                        {stat.label}
                      </p>
                      <p className={cn(
                        "font-mono font-semibold text-sm md:text-base",
                        stat.positive && "text-primary",
                        stat.negative && "text-destructive"
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
              <OptionChain
                stockPrice={stock.regularMarketPrice}
                symbol={symbol}
                onTrade={handleOptionTrade}
                onStockTrade={handleStockTrade}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/30 overflow-hidden">
              <CardHeader className="border-b border-border/30 bg-gradient-to-r from-accent/5 to-transparent">
                <CardTitle className="text-lg font-semibold">Related News</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <NewsSection stockSymbol={symbol} limit={6} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
