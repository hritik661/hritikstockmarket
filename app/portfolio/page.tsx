"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useBalance } from "@/hooks/use-balance"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { fetchMultipleQuotes, type StockQuote } from "@/lib/yahoo-finance"
import { formatCurrency, formatPercentage, isMarketOpen } from "@/lib/market-utils"
import { 
  calculatePnL, 
  calculatePnLPercent, 
  storeLastTradingPrice,
  getLastTradingPrice,
} from "@/lib/pnl-calculator"
import { calculateOptionsPnL, calculateOptionsPnLPercent } from "@/lib/options-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  Activity,
  ShoppingCart,
  DollarSign
} from "lucide-react"

interface Holding {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  lotSize?: number
}

interface HoldingWithQuote extends Holding {
  quote?: StockQuote
  currentValue: number
  pnl: number
  pnlPercent: number
}

export default function PortfolioPage() {
  const { user, isLoading: authLoading, updateBalance } = useAuth()
  const { deductBalance, addBalance } = useBalance()
  const { toast } = useToast()
  const router = useRouter()
  const [holdings, setHoldings] = useState<HoldingWithQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [marketOpen, setMarketOpen] = useState(false)

  const getLastPrices = () => {
    try {
      if (!user) return {} as Record<string, number>
      return JSON.parse(localStorage.getItem(`last_prices_${user.email}`) || "{}") as Record<string, number>
    } catch {
      return {}
    }
  }

  const setLastPrice = (symbol: string, price: number) => {
    try {
      if (!user) return
      const map = getLastPrices()
      map[symbol] = price
      localStorage.setItem(`last_prices_${user.email}`, JSON.stringify(map))
    } catch {}
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    const fetchHoldings = async () => {
      if (!user) return

      setLoading(true)

      let storedHoldings: Holding[] = []
      let clientHoldings: Holding[] = []
      
      try {
        clientHoldings = JSON.parse(localStorage.getItem(`holdings_${user.email}`) || "[]")
      } catch (e) {
        console.warn("Failed to parse localStorage holdings")
      }

      try {
        const response = await fetch("/api/holdings/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: user.email,
            holdings: clientHoldings 
          }),
        })
        const data = await response.json()
        if (data.success && data.holdings) {
          storedHoldings = data.holdings
        }
      } catch (error) {
        console.warn("Failed to sync holdings from database, using localStorage:", error)
        storedHoldings = clientHoldings
      }

      const stockHoldings = storedHoldings.filter((holding: Holding) => {
        const symbol = holding.symbol.replace('.NS', '').toUpperCase()
        return !['NIFTY', 'BANKNIFTY', 'SENSEX'].includes(symbol)
      })

      if (stockHoldings.length === 0) {
        setHoldings([])
        setLoading(false)
        return
      }

      const symbols = stockHoldings.map((h) => h.symbol)
      const quotes = await fetchMultipleQuotes(symbols)

      const holdingsWithQuotes = stockHoldings.map((holding: Holding) => {
        const quote = quotes.find((q) => q.symbol === holding.symbol)
        const currentMarketPrice = quote?.regularMarketPrice
        const marketStatus = isMarketOpen()
        
        let effectivePrice = holding.avgPrice
        if (marketStatus.isOpen && currentMarketPrice && !isNaN(currentMarketPrice) && currentMarketPrice > 0) {
          effectivePrice = currentMarketPrice
        }
        
        if (marketStatus.isOpen && currentMarketPrice && !isNaN(currentMarketPrice) && currentMarketPrice > 0) {
          storeLastTradingPrice(user.email, holding.symbol, currentMarketPrice)
        }
        
        const safeEffectivePrice = isNaN(effectivePrice) || effectivePrice <= 0 ? holding.avgPrice : effectivePrice
        const safeAvgPrice = isNaN(holding.avgPrice) ? 0 : holding.avgPrice
        const safeQuantity = isNaN(holding.quantity) ? 0 : holding.quantity
        
        const currentValue = safeEffectivePrice * safeQuantity
        const pnl = calculatePnL(safeAvgPrice, safeEffectivePrice, safeQuantity)
        const pnlPercent = calculatePnLPercent(safeAvgPrice, safeEffectivePrice)

        return {
          ...holding,
          quote,
          currentValue: isNaN(currentValue) || currentValue < 0 ? 0 : currentValue,
          pnl: isNaN(pnl) ? 0 : pnl,
          pnlPercent: isNaN(pnlPercent) ? 0 : pnlPercent,
        }
      })

      setHoldings(holdingsWithQuotes)
      setLoading(false)
    }

    fetchHoldings()
    
    let interval: NodeJS.Timeout
    const scheduleNextUpdate = () => {
      const marketStatus = isMarketOpen()
      const updateInterval = marketStatus.isOpen ? 30000 : 300000
      interval = setTimeout(() => {
        fetchHoldings()
        scheduleNextUpdate()
      }, updateInterval)
    }
    scheduleNextUpdate()

    return () => {
      if (interval) clearTimeout(interval)
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </main>
      </div>
    )
  }

  const totalInvested = holdings.reduce((sum, h) => {
    const avgPrice = isNaN(h.avgPrice) ? 0 : h.avgPrice
    const quantity = isNaN(h.quantity) ? 0 : h.quantity
    return sum + avgPrice * quantity
  }, 0)
  
  const totalCurrentValue = holdings.reduce((sum, h) => {
    return sum + (isNaN(h.currentValue) ? 0 : h.currentValue)
  }, 0)
  
  const totalPnL = totalCurrentValue - totalInvested
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 py-4 md:px-4 md:py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Portfolio</h1>
          <p className="text-muted-foreground text-sm">Track your investments and P&L</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="glass-card border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-xl md:text-2xl font-bold font-mono text-primary">
                    {formatCurrency(user.balance)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Portfolio Value</p>
                  <p className="text-xl md:text-2xl font-bold font-mono">
                    {formatCurrency(totalCurrentValue)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                  <p className="text-xl md:text-2xl font-bold font-mono">
                    {formatCurrency(totalInvested)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`glass-card border-border/30 ${totalPnL >= 0 ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-destructive'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total P&L</p>
                  <p className={`text-xl md:text-2xl font-bold font-mono ${totalPnL >= 0 ? "text-primary" : "text-destructive"}`}>
                    {totalPnL >= 0 ? "+" : ""}{formatCurrency(totalPnL)}
                  </p>
                  <p className={`text-xs ${totalPnL >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatPercentage(totalPnLPercent)}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${totalPnL >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                  {totalPnL >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-primary" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Section */}
        <Card className="border-border/30 overflow-hidden mb-6">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Stock Holdings ({holdings.length})
              </CardTitle>
              {holdings.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={async () => {
                    if (!user) return
                    if (!confirm('Sell all stock holdings? This action cannot be undone.')) return
                    
                    const storageKey = `holdings_${user.email}`
                    const rawHoldings = localStorage.getItem(storageKey) || '[]'
                    const holdingsArr: any[] = JSON.parse(rawHoldings)
                    
                    const stockHoldings = holdingsArr.filter((holding: any) => {
                      const symbol = holding.symbol.replace('.NS', '').toUpperCase()
                      return !['NIFTY', 'BANKNIFTY', 'SENSEX'].includes(symbol)
                    })
                    
                    let totalCredit = 0
                    stockHoldings.forEach((holding: any) => {
                      const quote = holdings.find(h => h.symbol === holding.symbol)?.quote
                      const price = quote?.regularMarketPrice || holding.avgPrice
                      totalCredit += price * holding.quantity
                    })
                    
                    localStorage.setItem(storageKey, '[]')
                    
                    try {
                      await fetch("/api/holdings/save", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: user.email, holdings: [] }),
                      })
                    } catch (error) {
                      console.warn("Failed to save empty holdings:", error)
                    }
                    
                    for (const holding of stockHoldings) {
                      const quote = holdings.find(h => h.symbol === holding.symbol)?.quote
                      const sellPrice = quote?.regularMarketPrice || holding.avgPrice
                      const sellValue = sellPrice * holding.quantity
                      
                      try {
                        await addBalance(sellValue, "SELL", holding.symbol, holding.quantity, sellPrice)
                      } catch (error) {
                        console.warn(`Failed to record transaction for ${holding.symbol}:`, error)
                      }
                    }
                    
                    toast({ title: 'All Holdings Sold', description: `Received ${formatCurrency(totalCredit)}` })
                    setHoldings([])
                  }}
                >
                  Sell All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <PieChart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Holdings Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Start trading to build your portfolio</p>
                <Link href="/">
                  <Button variant="outline" size="sm">Browse Stocks</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {holdings.map((holding) => (
                  <Link 
                    key={holding.symbol} 
                    href={`/stock/${encodeURIComponent(holding.symbol)}`} 
                    className="block hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{holding.symbol.replace('.NS', '').replace('.BO', '')}</h3>
                          <Badge variant="secondary" className="text-xs">{holding.quantity} shares</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{holding.name}</p>
                      </div>

                      <div className="hidden sm:flex flex-col items-end mr-6">
                        <p className="text-xs text-muted-foreground">Avg. Price</p>
                        <p className="font-mono text-sm">{formatCurrency(holding.avgPrice)}</p>
                      </div>

                      <div className="hidden md:flex flex-col items-end mr-6">
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className="font-mono text-sm">{formatCurrency(holding.quote?.regularMarketPrice || holding.avgPrice)}</p>
                      </div>

                      <div className="hidden lg:flex flex-col items-end mr-6">
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="font-mono text-sm font-semibold">{formatCurrency(holding.currentValue)}</p>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          holding.pnl >= 0 
                            ? "bg-primary/10 text-primary" 
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {holding.pnl >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {formatPercentage(holding.pnlPercent)}
                        </div>
                        <p className={`text-sm font-semibold mt-1 ${holding.pnl >= 0 ? "text-primary" : "text-destructive"}`}>
                          {holding.pnl >= 0 ? "+" : ""}{formatCurrency(holding.pnl)}
                        </p>
                      </div>

                      <div className="ml-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!user) return
                            
                            const price = holding.quote?.regularMarketPrice || holding.avgPrice
                            const qtyStr = window.prompt('How many shares to buy?', '1')
                            const qtyAdd = Math.max(0, Number.parseInt(qtyStr || '0') || 0)
                            if (!qtyAdd) return
                            
                            const totalCost = price * qtyAdd
                            if (totalCost > user.balance) {
                              toast({ title: 'Insufficient Balance', description: `You need ${formatCurrency(totalCost - user.balance)} more.`, variant: 'destructive' })
                              return
                            }

                            const storageKey = `holdings_${user.email}`
                            const raw = localStorage.getItem(storageKey) || '[]'
                            const arr: any[] = JSON.parse(raw)
                            const idx = arr.findIndex((h) => h.symbol === holding.symbol)
                            
                            if (idx >= 0) {
                              const existing = arr[idx]
                              const newQty = existing.quantity + qtyAdd
                              const newAvg = (existing.avgPrice * existing.quantity + price * qtyAdd) / newQty
                              arr[idx] = { ...existing, quantity: newQty, avgPrice: newAvg }
                            }
                            
                            localStorage.setItem(storageKey, JSON.stringify(arr))
                            
                            const balanceResult = await deductBalance(totalCost, "BUY", holding.symbol, qtyAdd, price)
                            if (!balanceResult.success) {
                              toast({ title: 'Transaction Failed', description: balanceResult.error, variant: 'destructive' })
                              return
                            }
                            
                            toast({ title: 'Order Executed', description: `Bought ${qtyAdd} shares of ${holding.symbol.replace('.NS', '')}` })
                            window.location.reload()
                          }}
                        >
                          Buy
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!user) return
                            
                            const price = holding.quote?.regularMarketPrice || holding.avgPrice
                            const qtyStr = window.prompt('How many shares to sell?', '1')
                            const qtySell = Math.max(0, Number.parseInt(qtyStr || '0') || 0)
                            if (!qtySell) return
                            
                            if (qtySell > holding.quantity) {
                              toast({ title: 'Invalid Quantity', description: `You only have ${holding.quantity} shares.`, variant: 'destructive' })
                              return
                            }

                            const storageKey = `holdings_${user.email}`
                            const raw = localStorage.getItem(storageKey) || '[]'
                            const arr: any[] = JSON.parse(raw)
                            const idx = arr.findIndex((h) => h.symbol === holding.symbol)
                            
                            if (idx >= 0) {
                              const newQty = arr[idx].quantity - qtySell
                              if (newQty <= 0) arr.splice(idx, 1)
                              else arr[idx] = { ...arr[idx], quantity: newQty }
                            }
                            
                            localStorage.setItem(storageKey, JSON.stringify(arr))
                            
                            const sellValue = price * qtySell
                            const profitLoss = (price - holding.avgPrice) * qtySell
                            const balanceResult = await addBalance(sellValue, "SELL", holding.symbol, qtySell, price)
                            if (!balanceResult.success) {
                              toast({ title: 'Transaction Failed', description: balanceResult.error, variant: 'destructive' })
                              return
                            }
                            
                            toast({ 
                              title: 'Order Executed', 
                              description: `Sold ${qtySell} shares for ${formatCurrency(sellValue)}. ${profitLoss >= 0 ? 'Profit' : 'Loss'}: ${formatCurrency(Math.abs(profitLoss))}`,
                              variant: profitLoss >= 0 ? "default" : "destructive"
                            })
                            window.location.reload()
                          }}
                        >
                          Sell
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options Positions */}
        <Card className="border-border/30 overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-accent/5 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Options Positions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              const raw = localStorage.getItem(`options_positions_${user.email}`) || '[]'
              const positions = JSON.parse(raw) as any[]
              
              if (!positions || positions.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No options positions yet</p>
                    <Link href="/options" className="text-primary text-sm hover:underline">
                      Start trading options
                    </Link>
                  </div>
                )
              }

              return (
                <div className="space-y-3">
                  {positions.map((pos) => {
                    const strikeKey = `${pos.index}-${pos.strike}-${pos.type}`
                    const lastPrices = getLastPrices()
                    const marketStatus = isMarketOpen()
                    
                    let currentPrice = pos.price
                    if (marketStatus.isOpen && typeof lastPrices[strikeKey] === 'number') {
                      currentPrice = lastPrices[strikeKey]
                    }
                    
                    const pnl = calculateOptionsPnL(pos.price, currentPrice, pos.action, pos.quantity, pos.lotSize)
                    const pnlPercent = calculateOptionsPnLPercent(pos.price, currentPrice, pos.action)

                    return (
                      <div key={pos.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{pos.index}</span>
                            <span className="font-mono">{Number(pos.strike).toLocaleString("en-IN")}</span>
                            <Badge variant={pos.type === "CE" ? "default" : "destructive"} className="text-xs">
                              {pos.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{pos.action}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {pos.quantity} lot(s) @ {formatCurrency(pos.price)} = {formatCurrency(pos.price * pos.quantity * pos.lotSize)}
                          </p>
                        </div>
                        
                        <div className="text-right mr-4">
                          <p className={`font-mono font-semibold ${pnl >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Now: {formatCurrency(currentPrice)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={async () => {
                              if (!user) return
                              const qtyStr = window.prompt('How many lots to buy?', '1')
                              const qtyBuy = Math.max(0, Number.parseInt(qtyStr || '0') || 0)
                              if (!qtyBuy) return

                              const totalCost = currentPrice * qtyBuy * pos.lotSize
                              if (totalCost > (user.balance || 0)) {
                                toast({ title: 'Insufficient Balance', variant: 'destructive' })
                                return
                              }

                              const rawOps = localStorage.getItem(`options_positions_${user.email}`) || '[]'
                              const ops: any[] = JSON.parse(rawOps)

                              const newPos = {
                                id: Math.random().toString(36).substring(7),
                                type: pos.type,
                                action: 'BUY',
                                index: pos.index,
                                strike: pos.strike,
                                price: currentPrice,
                                quantity: qtyBuy,
                                lotSize: pos.lotSize || 50,
                                totalValue: totalCost,
                                timestamp: Date.now(),
                              }

                              ops.push(newPos)
                              localStorage.setItem(`options_positions_${user.email}`, JSON.stringify(ops))
                              
                              const balanceResult = await deductBalance(totalCost, "BUY", strikeKey, qtyBuy, currentPrice)
                              if (!balanceResult.success) {
                                toast({ title: 'Transaction Failed', description: balanceResult.error, variant: 'destructive' })
                                return
                              }
                              
                              toast({ title: 'Order Placed', description: `Bought ${qtyBuy} lot(s) @ ${formatCurrency(currentPrice)}` })
                              window.location.reload()
                            }}
                          >
                            Buy
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={async () => {
                              if (!user) return
                              const rawOps = localStorage.getItem(`options_positions_${user.email}`) || '[]'
                              const ops: any[] = JSON.parse(rawOps)
                              const position = ops.find((p) => p.id === pos.id)
                              if (!position) return

                              const qtyStr = window.prompt('How many lots to sell?', '1')
                              const qtySell = Math.max(0, Number.parseInt(qtyStr || '0') || 0)
                              if (!qtySell) return

                              if (qtySell > position.quantity) {
                                toast({ title: 'Invalid Quantity', variant: 'destructive' })
                                return
                              }

                              const sellValue = currentPrice * qtySell * position.lotSize
                              const positionPnl = calculatePnL(position.price, currentPrice, qtySell * position.lotSize)

                              const balanceResult = await addBalance(sellValue, "SELL", strikeKey, qtySell, currentPrice)
                              if (!balanceResult.success) {
                                toast({ title: 'Transaction Failed', description: balanceResult.error, variant: 'destructive' })
                                return
                              }

                              let updatedOps: any[]
                              if (qtySell >= position.quantity) {
                                updatedOps = ops.filter((p) => p.id !== position.id)
                              } else {
                                updatedOps = ops.map((p) => 
                                  p.id === position.id 
                                    ? { ...p, quantity: p.quantity - qtySell } 
                                    : p
                                )
                              }
                              
                              localStorage.setItem(`options_positions_${user.email}`, JSON.stringify(updatedOps))

                              toast({ 
                                title: 'Position Closed', 
                                description: `${positionPnl >= 0 ? 'Profit' : 'Loss'}: ${formatCurrency(Math.abs(positionPnl))}`,
                                variant: positionPnl >= 0 ? "default" : "destructive"
                              })
                              window.location.reload()
                            }}
                          >
                            Sell
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
