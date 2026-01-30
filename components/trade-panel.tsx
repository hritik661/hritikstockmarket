"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useBalance } from "@/hooks/use-balance"
import type { StockQuote } from "@/lib/yahoo-finance"
import { formatCurrency } from "@/lib/market-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { TrendingUp, TrendingDown, Zap, Wallet, ShoppingCart, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface TradePanelProps {
  stock: StockQuote
  preselectedOption?: { action: "BUY" | "SELL"; type: "CE" | "PE"; strike: number; price: number } | null
  initialTab?: "buy" | "sell"
}

interface Holding {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
}

interface Transaction {
  id: string
  symbol: string
  name: string
  type: "buy" | "sell"
  quantity: number
  price: number
  total: number
  timestamp: number
}

export function TradePanel({ stock, preselectedOption, initialTab }: TradePanelProps) {
  const { user, updateBalance } = useAuth()
  const { deductBalance, addBalance } = useBalance()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState<string>('1')
  const [tradeType, setTradeType] = useState<"equity" | "options">("equity")
  const [optionType, setOptionType] = useState<"CE" | "PE">("CE")
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"buy" | "sell">(initialTab || "buy")

  const numQuantity = Math.max(0, parseInt(quantity || '0') || 0)
  const totalCost = numQuantity * stock.regularMarketPrice

  const storageKey = user ? `holdings_${user.email}` : "holdings_guest"
  const transactionsKey = user ? `transactions_${user.email}` : "transactions_guest"
  const holdings: Holding[] = JSON.parse(localStorage.getItem(storageKey) || "[]")
  const transactions: Transaction[] = JSON.parse(localStorage.getItem(transactionsKey) || "[]")
  const currentHolding = holdings.find((h: Holding) => h.symbol === stock.symbol)

  const handleBuy = async () => {
    if (!user) return
    const qty = Math.max(0, parseInt(quantity || '0') || 0)
    if (qty < 1) {
      toast({ title: 'Enter Quantity', description: 'Please enter a valid quantity to buy', variant: 'destructive' })
      return
    }
    const localTotal = qty * stock.regularMarketPrice
    if (localTotal > user.balance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(localTotal - user.balance)} more to complete this purchase.`,
        variant: "destructive",
      })
      return
    }

    const existingIndex = holdings.findIndex((h: Holding) => h.symbol === stock.symbol)
    if (existingIndex >= 0) {
      const existing = holdings[existingIndex]
      const newQuantity = existing.quantity + qty
      const newAvgPrice = (existing.avgPrice * existing.quantity + stock.regularMarketPrice * qty) / newQuantity
      holdings[existingIndex] = { ...existing, quantity: newQuantity, avgPrice: newAvgPrice }
    } else {
      holdings.push({
        symbol: stock.symbol,
        name: stock.shortName,
        quantity: qty,
        avgPrice: stock.regularMarketPrice,
      })
    }

    localStorage.setItem(storageKey, JSON.stringify(holdings))

    try {
      await fetch("/api/holdings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, holdings }),
      })
    } catch (error) {
      console.warn("Failed to save holdings to database:", error)
    }

    const balanceResult = await deductBalance(localTotal, "BUY", stock.symbol, qty, stock.regularMarketPrice)
    if (!balanceResult.success) {
      toast({
        title: "Transaction Failed",
        description: balanceResult.error,
        variant: "destructive",
      })
      return
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      symbol: stock.symbol,
      name: stock.shortName,
      type: "buy",
      quantity: qty,
      price: stock.regularMarketPrice,
      total: localTotal,
      timestamp: Date.now(),
    }
    transactions.push(transaction)
    localStorage.setItem(transactionsKey, JSON.stringify(transactions))

    toast({
      title: "Order Executed",
      description: `Bought ${qty} shares of ${stock.symbol.replace(".NS", "")} at ${formatCurrency(stock.regularMarketPrice)}`,
    })

    setQuantity('1')

    try {
      window.dispatchEvent(
        new CustomEvent("tradeCompleted", { detail: { symbol: stock.symbol, type: "buy", quantity: qty } }),
      )
    } catch (e) {}
  }

  const handleSell = async () => {
    if (!user) return
    const qty = Math.max(0, parseInt(quantity || '0') || 0)
    if (qty < 1) {
      toast({ title: 'Enter Quantity', description: 'Please enter a valid quantity to sell', variant: 'destructive' })
      return
    }

    if (!currentHolding || currentHolding.quantity < qty) {
      toast({
        title: "Insufficient Shares",
        description: `You only have ${currentHolding?.quantity || 0} shares to sell.`,
        variant: "destructive",
      })
      return
    }

    const sellPrice = stock.regularMarketPrice
    const sellValue = qty * sellPrice
    const buyPrice = currentHolding.avgPrice
    const profitLoss = (sellPrice - buyPrice) * qty

    const existingIndex = holdings.findIndex((h: Holding) => h.symbol === stock.symbol)
    if (existingIndex >= 0) {
      const newQuantity = holdings[existingIndex].quantity - qty
      if (newQuantity <= 0) {
        holdings.splice(existingIndex, 1)
      } else {
        holdings[existingIndex].quantity = newQuantity
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(holdings))

    try {
      await fetch("/api/holdings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, holdings }),
      })
    } catch (error) {
      console.warn("Failed to save holdings to database:", error)
    }

    const balanceResult = await addBalance(sellValue, "SELL", stock.symbol, qty, sellPrice)
    if (!balanceResult.success) {
      toast({
        title: "Transaction Failed",
        description: balanceResult.error,
        variant: "destructive",
      })
      return
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      symbol: stock.symbol,
      name: stock.shortName,
      type: "sell",
      quantity: qty,
      price: sellPrice,
      total: sellValue,
      timestamp: Date.now(),
    }
    transactions.push(transaction)
    localStorage.setItem(transactionsKey, JSON.stringify(transactions))

    toast({
      title: "Order Executed",
      description: `Sold ${qty} shares at ${formatCurrency(sellPrice)}. ${profitLoss >= 0 ? 'Profit' : 'Loss'}: ${formatCurrency(Math.abs(profitLoss))}`,
      variant: profitLoss >= 0 ? "default" : "destructive",
    })

    setQuantity('1')

    try {
      window.dispatchEvent(
        new CustomEvent("tradeCompleted", { detail: { symbol: stock.symbol, type: "sell", quantity: qty } }),
      )
    } catch (e) {}
  }

  const isLoggedIn = !!user

  useEffect(() => {
    if (!preselectedOption) return
    setTradeType("options")
    setOptionType(preselectedOption.type)
    setSelectedStrike(preselectedOption.strike)
    setActiveTab(preselectedOption.action === "BUY" ? "buy" : "sell")
  }, [preselectedOption])

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  if (!isLoggedIn) {
    return (
      <Card className="border-border/30 overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-lg">Trade {stock.symbol.replace(".NS", "").replace(".BO", "")}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Please login to buy or sell stocks.</p>
          <div className="flex gap-3">
            <Button asChild className="flex-1 h-11 rounded-xl">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 h-11 rounded-xl">
              <Link href="/login">Sign Up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="trade-panel" className="border-border/30 overflow-hidden">
      <CardHeader className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Trade {stock.symbol.replace(".NS", "").replace(".BO", "")}</CardTitle>
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
            <Button
              variant={tradeType === "equity" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-3 rounded-md"
              onClick={() => setTradeType("equity")}
            >
              Equity
            </Button>
            <Button
              variant={tradeType === "options" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-3 rounded-md"
              onClick={() => setTradeType("options")}
            >
              Options
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        {tradeType === "options" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className={cn(
                  "h-14 gap-2 rounded-xl transition-all",
                  optionType === "CE" 
                    ? "bg-primary/10 border-primary text-primary hover:bg-primary/20" 
                    : "hover:border-primary/50"
                )}
                onClick={() => setOptionType("CE")}
              >
                <TrendingUp className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Call (CE)</div>
                  <div className="text-xs opacity-70">Bullish</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-14 gap-2 rounded-xl transition-all",
                  optionType === "PE" 
                    ? "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20" 
                    : "hover:border-destructive/50"
                )}
                onClick={() => setOptionType("PE")}
              >
                <TrendingDown className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Put (PE)</div>
                  <div className="text-xs opacity-70">Bearish</div>
                </div>
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Strike Price</Label>
              <div className="grid grid-cols-3 gap-2">
                {[-1, 0, 1].map((offset) => {
                  const strike = Math.round(stock.regularMarketPrice / 50) * 50 + offset * 50
                  const isSelected = selectedStrike === strike
                  const isAtm = offset === 0
                  return (
                    <Button
                      key={offset}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "font-mono text-sm h-10 rounded-lg relative",
                        isSelected && "shadow-md",
                        !isSelected && "hover:border-primary/50"
                      )}
                      onClick={() => setSelectedStrike(strike)}
                    >
                      {strike.toLocaleString('en-IN')}
                      {isAtm && <span className="absolute -top-2 right-1 text-[10px] bg-primary text-primary-foreground px-1 rounded">ATM</span>}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Lot Size</Label>
              <Input type="number" defaultValue={50} disabled className="bg-secondary/30 font-mono h-10 rounded-lg" />
            </div>

            <Button
              className="w-full h-12 gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity font-semibold text-base"
              onClick={async () => {
                try {
                  const strike = selectedStrike ?? Math.round(stock.regularMarketPrice / 50) * 50
                  const lotSize = 50
                  const premium = preselectedOption?.price ?? Math.max(1, +(stock.regularMarketPrice * 0.02).toFixed(2))
                  const totalCost = premium * lotSize

                  if (totalCost > (user?.balance || 0)) {
                    toast({
                      title: "Insufficient Balance",
                      description: `You need ${formatCurrency(totalCost - (user?.balance || 0))} more.`,
                      variant: "destructive",
                    })
                    return
                  }

                  const optSymbol = `${stock.symbol}-OPT-${optionType}-${strike}`
                  const raw = localStorage.getItem(storageKey) || "[]"
                  const holdingsLocal: any[] = JSON.parse(raw)
                  const idx = holdingsLocal.findIndex((h) => h.symbol === optSymbol)

                  if (idx >= 0) {
                    const existing = holdingsLocal[idx]
                    const newQuantity = existing.quantity + 1
                    const newAvg = (existing.avgPrice * existing.quantity + premium) / newQuantity
                    holdingsLocal[idx] = { ...existing, quantity: newQuantity, avgPrice: newAvg }
                  } else {
                    holdingsLocal.push({
                      symbol: optSymbol,
                      name: `${stock.shortName} ${optionType} ${strike}`,
                      quantity: 1,
                      avgPrice: premium,
                      lotSize,
                    })
                  }

                  localStorage.setItem(storageKey, JSON.stringify(holdingsLocal))
                  
                  const res = await deductBalance(totalCost, "BUY", stock.symbol, 1, premium)
                  if (!res.success) {
                    const rawRollback = localStorage.getItem(storageKey) || "[]"
                    const holdingsRollback: any[] = JSON.parse(rawRollback).filter((h: any) => h.symbol !== optSymbol)
                    localStorage.setItem(storageKey, JSON.stringify(holdingsRollback))
                    toast({ title: "Transaction Failed", description: res.error, variant: "destructive" })
                    return
                  }

                  toast({
                    title: "Option Order Placed",
                    description: `${optionType} @ ${strike} - ${lotSize} qty at ${formatCurrency(premium)} premium`,
                  })
                } catch (err) {
                  console.error("option order error", err)
                  toast({ title: "Error", description: "Unable to place option order" })
                }
              }}
            >
              <Zap className="h-5 w-5" />
              Place Option Order
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "buy" | "sell")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-secondary/50 rounded-xl">
              <TabsTrigger
                value="buy"
                className="rounded-lg h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className="rounded-lg h-full data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-md font-semibold transition-all"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4 mt-5">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Quantity</Label>
                <Input
                  id="buy-quantity"
                  type="text"
                  placeholder="Enter number of shares"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))}
                  className="h-12 text-lg font-mono bg-secondary/30 rounded-xl"
                />
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Price per share</span>
                  <span className="font-mono font-semibold">{formatCurrency(stock.regularMarketPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Cost</span>
                  <span className="font-mono font-bold text-lg">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" />
                    Available Balance
                  </span>
                  <span className="font-mono font-semibold text-primary">{formatCurrency(user.balance)}</span>
                </div>
              </div>

              <Button 
                className="btn-buy w-full h-14 gap-2 text-base font-semibold rounded-xl"
                onClick={handleBuy} 
                disabled={numQuantity < 1 || totalCost > user.balance}
              >
                <TrendingUp className="h-5 w-5" />
                Buy {numQuantity} {numQuantity === 1 ? "Share" : "Shares"}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4 mt-5">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Quantity</Label>
                <Input
                  id="sell-quantity"
                  type="text"
                  placeholder="Enter number of shares"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))}
                  className="h-12 text-lg font-mono bg-secondary/30 rounded-xl"
                />
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your Holdings</span>
                  <span className="font-mono font-semibold">{currentHolding?.quantity || 0} shares</span>
                </div>
                {currentHolding && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Buy Price</span>
                    <span className="font-mono">{formatCurrency(currentHolding.avgPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Price</span>
                  <span className="font-mono font-semibold">{formatCurrency(stock.regularMarketPrice)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <span className="font-mono font-bold text-lg">{formatCurrency(totalCost)}</span>
                </div>
                {currentHolding && numQuantity > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Est. P&L</span>
                    <span className={cn(
                      "font-mono font-semibold",
                      (stock.regularMarketPrice - currentHolding.avgPrice) * numQuantity >= 0 
                        ? "text-primary" 
                        : "text-destructive"
                    )}>
                      {(stock.regularMarketPrice - currentHolding.avgPrice) * numQuantity >= 0 ? '+' : ''}
                      {formatCurrency((stock.regularMarketPrice - currentHolding.avgPrice) * numQuantity)}
                    </span>
                  </div>
                )}
              </div>

              <Button
                className="btn-sell w-full h-14 gap-2 text-base font-semibold rounded-xl"
                onClick={handleSell}
                disabled={!currentHolding || currentHolding.quantity < numQuantity || numQuantity < 1}
              >
                <TrendingDown className="h-5 w-5" />
                Sell {numQuantity} {numQuantity === 1 ? "Share" : "Shares"}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
