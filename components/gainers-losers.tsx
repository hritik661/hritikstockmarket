"use client"

import { useState, useEffect } from "react"
import { fetchGainersLosers, type StockQuote } from "@/lib/yahoo-finance"
import { formatCurrency, formatPercentage } from "@/lib/market-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { quoteCache } from "@/lib/cache-utils"

export function GainersLosers() {
  const [gainers, setGainers] = useState<StockQuote[]>([])
  const [losers, setLosers] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const TOP_COUNT = 100 // Show top 100 gainers/losers

  useEffect(() => {
    const fetchGainersLosersData = async () => {
      try {
        const { INDIAN_STOCKS } = await import("@/lib/stocks-data")
        const { fetchMultipleQuotes } = await import("@/lib/yahoo-finance")
        // Fetch all stocks to show all gainers
        const allSymbols = INDIAN_STOCKS.map(stock => stock.symbol)
        const cacheKey = `gainers_losers:${allSymbols.length}:${allSymbols.slice(0, 10).join(',')}`
        
        // Use cache with deduplication for ultra-fast loading
        const quotes = await quoteCache.withDedup(
          cacheKey,
          () => fetchMultipleQuotes(allSymbols),
          45000 // Cache for 45 seconds
        )
        
        if (!loading) setLoading(true) // Only set if not already loading
        // Show gainers between 5% and 30% (all gainer stocks)
        const gainersSorted = quotes
          .filter(q => typeof q.regularMarketChangePercent === 'number' && (q.regularMarketChangePercent || 0) >= 5)
          .sort((a, b) => (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0))
          .slice(0, TOP_COUNT)
        
        // Show losing stocks - ANY NEGATIVE CHANGE (more flexible for display)
        let losersSorted = quotes
          .filter(q => typeof q.regularMarketChangePercent === 'number' && (q.regularMarketChangePercent || 0) < 0)
          .sort((a, b) => (a.regularMarketChangePercent || 0) - (b.regularMarketChangePercent || 0))
          .slice(0, TOP_COUNT)
        
        setGainers(gainersSorted)
        setLosers(losersSorted)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching gainers/losers:", error)
        setLoading(false)
        setGainers([])
        setLosers([])
      }
    }
    fetchGainersLosersData()
    // Refresh every 3 minutes instead of 5 for fresher data
    const interval = setInterval(fetchGainersLosersData, 180000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Gainers Loading */}
        <Card className="border-2 border-border/50 shadow-lg bg-card">
          <CardHeader className="pb-1 md:pb-2">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 md:space-y-2">
            {Array.from({ length: TOP_COUNT }).map((_, j) => (
              <Skeleton key={j} className="h-6 md:h-8 w-full" />
            ))}
          </CardContent>
        </Card>

        {/* Losers Loading */}
        <Card className="border-2 border-border/50 shadow-lg bg-card">
          <CardHeader className="pb-1 md:pb-2">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 md:space-y-2">
            {Array.from({ length: TOP_COUNT }).map((_, j) => (
              <Skeleton key={j} className="h-6 md:h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
      {/* Top Gainers Card */}
      <Card className="shadow-lg bg-card hover:border-primary/30 transition-colors p-1 md:p-2">
        <CardHeader className="pb-0.5 md:pb-2">
          <CardTitle className="text-xs md:text-base flex items-center gap-1 md:gap-2">
            <TrendingUp className="h-2.5 w-2.5 md:h-4 md:w-4 text-primary" />
            Top Gainers (5%+)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5 md:space-y-2 max-h-48 md:max-h-80 overflow-y-auto">
          {Array.from(new Map(gainers.map(s => [s.symbol, s])).values()).map((stock) => (
            <Link
              key={stock.symbol}
              href={`/stock/${encodeURIComponent(stock.symbol)}`}
              className="block"
            >
              <div className="flex items-center justify-between p-1 md:p-2 rounded-md md:rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border-2 border-border/40 hover:border-border/60">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-0.5 md:gap-2 mb-0.5 md:mb-1">
                    <h3 className="font-semibold text-xs md:text-sm truncate">
                      {stock.symbol.replace('.NS', '').replace('.BO', '')}
                    </h3>
                    <Badge
                      variant="default"
                      className="text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 bg-primary/20 text-primary"
                    >
                      {formatPercentage(stock.regularMarketChangePercent)}
                    </Badge>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                    {stock.shortName || stock.longName}
                  </p>
                </div>
                <div className="text-right ml-1 md:ml-2">
                  <p className="font-mono font-semibold text-[10px] md:text-sm">
                    {formatCurrency(stock.regularMarketPrice)}
                  </p>
                  <p className="text-[10px] md:text-xs flex items-center gap-0.5 md:gap-1 text-primary">
                    <ArrowUpRight className="h-2 w-2 md:h-2.5 md:w-2.5" />
                    {formatCurrency(stock.regularMarketChange)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {gainers.length === 0 && (
            <p className="text-[10px] md:text-sm text-muted-foreground text-center py-2 md:py-4">
              No gainers available
            </p>
          )}
        </CardContent>
      </Card>
      {/* Top Losers Card */}
      <Card className="shadow-lg bg-card border-2 border-border/50 hover:border-border/70 transition-colors p-1 md:p-2">
        <CardHeader className="pb-0.5 md:pb-2">
          <CardTitle className="text-xs md:text-base flex items-center gap-1 md:gap-2">
            <TrendingDown className="h-2.5 w-2.5 md:h-4 md:w-4 text-destructive" />
            Top Losers (Below 0%)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5 md:space-y-2 max-h-48 md:max-h-80 overflow-y-auto">
          {Array.from(new Map(losers.map(s => [s.symbol, s])).values()).map((stock) => (
            <Link
              key={stock.symbol}
              href={`/stock/${encodeURIComponent(stock.symbol)}`}
              className="block"
            >
              <div className="flex items-center justify-between p-1 md:p-2 rounded-md md:rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border-2 border-border/40 hover:border-border/60">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-0.5 md:gap-2 mb-0.5 md:mb-1">
                    <h3 className="font-semibold text-xs md:text-sm truncate">
                      {stock.symbol.replace('.NS', '').replace('.BO', '')}
                    </h3>
                    <Badge
                      variant="destructive"
                      className="text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 bg-destructive/20 text-destructive"
                    >
                      {formatPercentage(stock.regularMarketChangePercent)}
                    </Badge>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                    {stock.shortName || stock.longName}
                  </p>
                </div>
                <div className="text-right ml-1 md:ml-2">
                  <p className="font-mono font-semibold text-[10px] md:text-sm">
                    {formatCurrency(stock.regularMarketPrice)}
                  </p>
                  <p className="text-[10px] md:text-xs flex items-center gap-0.5 md:gap-1 text-destructive">
                    <ArrowDownRight className="h-2 w-2 md:h-2.5 md:w-2.5" />
                    {formatCurrency(stock.regularMarketChange)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {losers.length === 0 && (
            <p className="text-[10px] md:text-sm text-muted-foreground text-center py-2 md:py-4">
              No losers available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
