"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { formatCurrency, isMarketOpen } from "@/lib/market-utils"
import { 
  calculateOptionsPnL, 
  calculateOptionsPnLPercent,
  storeLastTradingPrice, 
  getLastTradingPrice,
  getEffectivePrice 
} from "@/lib/options-calculator"
import { useBalance } from "@/hooks/use-balance"
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  RefreshCw, 
  Wallet,
  BarChart3,
  ShoppingCart
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OptionStrike {
  strike: number
  cePrice: number
  pePrice: number
  ceChange: number
  peChange: number
  ceOI: number
  peOI: number
  ceVolume: number
  peVolume: number
  ceIV: string
  peIV: string
  isATM: boolean
  isITM: boolean
}

interface Position {
  id: string
  type: "CE" | "PE"
  action: "BUY" | "SELL"
  index: string
  strike: number
  price: number
  quantity: number
  lotSize: number
  totalValue: number
  timestamp: number
}

const INDIAN_INDICES = [
  { symbol: "NIFTY", name: "NIFTY 50", price: 26329, lotSize: 50, strikeGap: 50 },
  { symbol: "BANKNIFTY", name: "BANK NIFTY", price: 60151, lotSize: 50, strikeGap: 100 },
  { symbol: "SENSEX", name: "BSE SENSEX", price: 85762, lotSize: 50, strikeGap: 100 },
]

export default function OptionsPage() {
  const { user, updateBalance } = useAuth()
  const { toast } = useToast()
  const [selectedIndex, setSelectedIndex] = useState(INDIAN_INDICES[0])
  const [expiry, setExpiry] = useState("Current Week")
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [selectedOption, setSelectedOption] = useState<{
    type: "CE" | "PE"
    strike: number
    price: number
  } | null>(null)
  const [tradeAction, setTradeAction] = useState<"BUY" | "SELL">("BUY")
  const [quantity, setQuantity] = useState(1)
  const [positions, setPositions] = useState<Position[]>([])
  const [loadingChain, setLoadingChain] = useState(false)
  const [pricesLoading, setPricesLoading] = useState(true)
  const [strikesByIndex, setStrikesByIndex] = useState<Record<string, OptionStrike[]>>({})
  const [strikes, setStrikes] = useState<OptionStrike[]>([])
  const [marketOpen, setMarketOpen] = useState(false)

  const { deductBalance, addBalance } = useBalance()

  // Fetch indices prices
  useEffect(() => {
    const fetchIndicesPrices = async () => {
      try {
        const response = await fetch("/api/indices?all=true")
        if (response.ok) {
          const data = await response.json()
          if (data.indices && Array.isArray(data.indices)) {
            const niftyData = data.indices.find((i: any) => i.symbol === "NIFTY")
            if (niftyData) {
              setSelectedIndex((prev) => ({ ...prev, price: niftyData.price }))
            }
            INDIAN_INDICES.forEach((idx) => {
              const matchedIndex = data.indices.find((i: any) => i.symbol === idx.symbol)
              if (matchedIndex) idx.price = matchedIndex.price
            })
          }
        }
        setPricesLoading(false)
      } catch (error) {
        console.error("Error fetching indices prices:", error)
        setPricesLoading(false)
      }
    }

    fetchIndicesPrices()
    const interval = setInterval(fetchIndicesPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load positions
  useEffect(() => {
    if (user) {
      try {
        const savedPositions = localStorage.getItem(`options_positions_${user.email}`)
        if (savedPositions) {
          const parsed = JSON.parse(savedPositions)
          if (Array.isArray(parsed)) setPositions(parsed)
        }
      } catch (err) {
        console.error("Error loading positions:", err)
      }
    }
  }, [user])

  // Fetch option chain
  useEffect(() => {
    const fetchOptionChain = async () => {
      try {
        setLoadingChain(true)
        const response = await fetch(
          `/api/options/chain?symbol=${selectedIndex.symbol}&strikeGap=${selectedIndex.strikeGap}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.strikes && Array.isArray(data.strikes)) {
            setStrikes(data.strikes)
            if (typeof data.marketOpen === 'boolean') setMarketOpen(data.marketOpen)
          }
        }
        setLoadingChain(false)
      } catch (error) {
        console.error("Error fetching option chain:", error)
        setLoadingChain(false)
      }
    }

    fetchOptionChain()
    const interval = setInterval(fetchOptionChain, marketOpen ? 10000 : 60000)
    return () => clearInterval(interval)
  }, [selectedIndex.symbol, selectedIndex.strikeGap, marketOpen])

  const handleOptionClick = (type: "CE" | "PE", strike: number, price: number) => {
    setSelectedOption({ type, strike, price })
    setShowTradeModal(true)
  }

  const handleTrade = async () => {
    if (!user || !selectedOption) return

    const totalValue = selectedOption.price * quantity * selectedIndex.lotSize

    if (tradeAction === "BUY" && totalValue > user.balance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(totalValue - user.balance)} more.`,
        variant: "destructive",
      })
      return
    }

    const newPosition: Position = {
      id: Math.random().toString(36).substring(7),
      type: selectedOption.type,
      action: tradeAction,
      index: selectedIndex.symbol,
      strike: selectedOption.strike,
      price: selectedOption.price,
      quantity,
      lotSize: selectedIndex.lotSize,
      totalValue,
      timestamp: Date.now(),
    }

    const updatedPositions = [...positions, newPosition]
    setPositions(updatedPositions)
    localStorage.setItem(`options_positions_${user.email}`, JSON.stringify(updatedPositions))

    if (tradeAction === "BUY") {
      const res = await deductBalance(totalValue, "BUY", selectedIndex.symbol, quantity, selectedOption.price)
      if (!res.success) {
        const rolled = positions.filter((p) => p.id !== newPosition.id)
        setPositions(rolled)
        localStorage.setItem(`options_positions_${user.email}`, JSON.stringify(rolled))
        toast({ title: "Transaction Failed", description: res.error, variant: "destructive" })
        return
      }
    } else {
      const res = await addBalance(totalValue, "SELL", selectedIndex.symbol, quantity, selectedOption.price)
      if (!res.success) {
        const rolled = positions.filter((p) => p.id !== newPosition.id)
        setPositions(rolled)
        localStorage.setItem(`options_positions_${user.email}`, JSON.stringify(rolled))
        toast({ title: "Transaction Failed", description: res.error, variant: "destructive" })
        return
      }
    }

    toast({
      title: `${tradeAction} Order Executed`,
      description: `${tradeAction === "BUY" ? "Bought" : "Sold"} ${quantity} lot(s) of ${selectedIndex.symbol} ${selectedOption.strike} ${selectedOption.type} @ ${formatCurrency(selectedOption.price)}`,
    })

    setShowTradeModal(false)
    setQuantity(1)
    try {
      storeLastTradingPrice(user.email, `${newPosition.index}-${newPosition.strike}-${newPosition.type}`, newPosition.price)
    } catch {}
  }

  const closePosition = async (position: Position) => {
    if (!user) return

    const marketStatus = isMarketOpen()
    let livePrice: number | undefined = undefined
    if (marketStatus.isOpen) {
      const positionStrikes = strikesByIndex[position.index] || []
      let strike = positionStrikes.find((s) => s.strike === position.strike)
      if (!strike && position.index === selectedIndex.symbol) {
        strike = strikes.find((s) => s.strike === position.strike)
      }
      if (strike) {
        livePrice = position.type === "CE" ? strike.cePrice : strike.pePrice
      }
    }

    const key = `${position.index}-${position.strike}-${position.type}`
    const lastPrice = getLastTradingPrice(user.email, key)
    const effectivePrice = getEffectivePrice(livePrice, lastPrice, position.price)
    const pnl = calculateOptionsPnL(position.price, effectivePrice, position.action, position.quantity, position.lotSize)
    const sellValue = effectivePrice * position.quantity * position.lotSize
    
    const res = await addBalance(sellValue, "SELL", position.index, position.quantity, effectivePrice)
    if (!res.success) {
      toast({ title: "Transaction Failed", description: res.error, variant: "destructive" })
      return
    }

    const updatedPositions = positions.filter((p) => p.id !== position.id)
    setPositions(updatedPositions)
    localStorage.setItem(`options_positions_${user.email}`, JSON.stringify(updatedPositions))

    try { storeLastTradingPrice(user.email, key, effectivePrice) } catch {}

    toast({
      title: "Position Closed",
      description: `${pnl >= 0 ? "Profit" : "Loss"}: ${formatCurrency(Math.abs(pnl))}`,
      variant: pnl >= 0 ? "default" : "destructive",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 py-4 md:px-4 md:py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Options Trading</h1>
              <p className="text-muted-foreground text-sm">Trade NIFTY, BANKNIFTY & SENSEX Options</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPricesLoading(true)}
            disabled={pricesLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", pricesLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Index Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {INDIAN_INDICES.map((index) => (
            <Card
              key={index.symbol}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "cursor-pointer transition-all border-border/30",
                selectedIndex.symbol === index.symbol 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "hover:border-primary/50 hover:shadow-md"
              )}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{index.name}</p>
                    <p className="text-2xl font-bold font-mono">{formatCurrency(index.price)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={selectedIndex.symbol === index.symbol ? "default" : "secondary"}>
                      Lot: {index.lotSize}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Positions */}
        {positions.length > 0 && (
          <Card className="border-border/30 mb-6 overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-gradient-to-r from-accent/5 to-transparent">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  My Positions ({positions.length})
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={async () => {
                    if (!user) return
                    const marketStatus = isMarketOpen()

                    let totalCredit = 0
                    positions.forEach((pos) => {
                      let currentPrice = pos.price
                      if (marketStatus.isOpen) {
                        const positionStrikes = strikesByIndex[pos.index] || []
                        let strike = positionStrikes.find((s) => s.strike === pos.strike)
                        if (!strike && pos.index === selectedIndex.symbol) {
                          strike = strikes.find((s) => s.strike === pos.strike)
                        }
                        if (strike) {
                          currentPrice = pos.type === "CE" ? strike.cePrice : strike.pePrice
                        }
                      }
                      totalCredit += currentPrice * pos.quantity * pos.lotSize
                    })

                    const r = await addBalance(totalCredit, "SELL", "OPTIONS", positions.length, undefined)
                    if (!r.success) {
                      toast({ title: "Transaction Failed", description: r.error, variant: "destructive" })
                      return
                    }

                    setPositions([])
                    localStorage.setItem(`options_positions_${user.email}`, JSON.stringify([]))

                    toast({
                      title: "All Positions Sold",
                      description: `Received ${formatCurrency(totalCredit)}`,
                    })
                  }}
                >
                  Sell All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30">
                    <TableHead className="text-xs">Index</TableHead>
                    <TableHead className="text-xs">Strike</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Qty</TableHead>
                    <TableHead className="text-xs">Entry</TableHead>
                    <TableHead className="text-xs">Current</TableHead>
                    <TableHead className="text-xs">P/L</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => {
                    const marketStatus = isMarketOpen()
                    let currentPrice = pos.price
                    if (marketStatus.isOpen) {
                      const positionStrikes = strikesByIndex[pos.index] || []
                      const strike = positionStrikes.find((s) => s.strike === pos.strike)
                      if (strike) {
                        currentPrice = pos.type === "CE" ? strike.cePrice : strike.pePrice
                      }
                    }
                    const pnl = calculateOptionsPnL(pos.price, currentPrice, pos.action, pos.quantity, pos.lotSize)
                    const pnlPercent = calculateOptionsPnLPercent(pos.price, currentPrice, pos.action)

                    return (
                      <TableRow key={pos.id}>
                        <TableCell className="font-medium text-sm">{pos.index}</TableCell>
                        <TableCell className="font-mono text-sm">{pos.strike.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Badge variant={pos.type === "CE" ? "default" : "destructive"} className="text-xs">
                            {pos.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{pos.quantity}</TableCell>
                        <TableCell className="font-mono text-sm">{formatCurrency(pos.price)}</TableCell>
                        <TableCell className="font-mono text-sm">{formatCurrency(currentPrice)}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-mono font-semibold text-sm",
                            pnl >= 0 ? "text-primary" : "text-destructive"
                          )}>
                            {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => closePosition(pos)}
                          >
                            Close
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Option Chain */}
        <Card className="border-border/30 overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Option Chain - {selectedIndex.symbol}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Spot: <span className="font-mono font-semibold text-foreground">{formatCurrency(selectedIndex.price)}</span>
                </p>
              </div>
              <div className="flex gap-2">
                {["Current Week", "Next Week", "Monthly"].map((e) => (
                  <Badge
                    key={e}
                    variant={expiry === e ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => setExpiry(e)}
                  >
                    {e}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingChain || strikes.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading option chain...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30">
                      <TableHead colSpan={3} className="text-center bg-primary/10 text-primary font-bold border-r border-border">
                        CALLS (CE)
                      </TableHead>
                      <TableHead className="text-center bg-secondary/50 font-bold border-r border-border">STRIKE</TableHead>
                      <TableHead colSpan={3} className="text-center bg-destructive/10 text-destructive font-bold">
                        PUTS (PE)
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-secondary/20 text-xs">
                      <TableHead className="text-center">OI</TableHead>
                      <TableHead className="text-center">Chg%</TableHead>
                      <TableHead className="text-center border-r border-border">LTP</TableHead>
                      <TableHead className="text-center bg-secondary/30 border-r border-border">Price</TableHead>
                      <TableHead className="text-center">LTP</TableHead>
                      <TableHead className="text-center">Chg%</TableHead>
                      <TableHead className="text-center">OI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strikes.map((s) => (
                      <TableRow
                        key={s.strike}
                        className={cn(
                          "transition-colors",
                          s.isATM ? "bg-accent/10" : s.isITM ? "bg-primary/5" : "hover:bg-secondary/30"
                        )}
                      >
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {(s.ceOI / 1000).toFixed(1)}k
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <span className={cn(s.ceChange >= 0 ? "text-primary" : "text-destructive")}>
                            {s.ceChange >= 0 ? "+" : ""}{s.ceChange.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center border-r border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary hover:text-primary-foreground font-mono font-semibold h-8 px-3 text-sm"
                            onClick={() => handleOptionClick("CE", s.strike, s.cePrice)}
                          >
                            {formatCurrency(s.cePrice)}
                          </Button>
                        </TableCell>
                        <TableCell className={cn(
                          "text-center font-bold font-mono text-sm border-r border-border",
                          s.isATM ? "bg-accent/20" : "bg-secondary/30"
                        )}>
                          {s.strike.toLocaleString("en-IN")}
                          {s.isATM && <Badge variant="secondary" className="ml-2 text-[10px]">ATM</Badge>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground font-mono font-semibold h-8 px-3 text-sm"
                            onClick={() => handleOptionClick("PE", s.strike, s.pePrice)}
                          >
                            {formatCurrency(s.pePrice)}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <span className={cn(s.peChange >= 0 ? "text-primary" : "text-destructive")}>
                            {s.peChange >= 0 ? "+" : ""}{s.peChange.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {(s.peOI / 1000).toFixed(1)}k
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade Modal */}
        <Dialog open={showTradeModal} onOpenChange={setShowTradeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Trade {selectedIndex.symbol} {selectedOption?.strike} {selectedOption?.type}
              </DialogTitle>
            </DialogHeader>

            {selectedOption && (
              <div className="space-y-5">
                <Tabs value={tradeAction} onValueChange={(v) => setTradeAction(v as "BUY" | "SELL")}>
                  <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-secondary/50 rounded-xl">
                    <TabsTrigger
                      value="BUY"
                      className="rounded-lg h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Buy
                    </TabsTrigger>
                    <TabsTrigger
                      value="SELL"
                      className="rounded-lg h-full data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground font-semibold"
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Sell
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-secondary/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Strike</p>
                    <p className="font-mono font-bold">{selectedOption.strike.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant={selectedOption.type === "CE" ? "default" : "destructive"}>
                      {selectedOption.type === "CE" ? "CALL" : "PUT"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Premium</p>
                    <p className="font-mono font-bold text-primary">{formatCurrency(selectedOption.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lot Size</p>
                    <p className="font-mono font-bold">{selectedIndex.lotSize}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase">Quantity (Lots)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="font-mono h-11 rounded-xl"
                  />
                </div>

                <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premium</span>
                    <span className="font-mono">{formatCurrency(selectedOption.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{quantity} x {selectedIndex.lotSize} = {quantity * selectedIndex.lotSize}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/30">
                    <span className="font-semibold">Total Value</span>
                    <span className="font-mono font-bold text-lg">
                      {formatCurrency(selectedOption.price * quantity * selectedIndex.lotSize)}
                    </span>
                  </div>
                </div>

                {user && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Wallet className="h-4 w-4" />
                      Available Balance
                    </span>
                    <span className="font-mono font-semibold text-primary">{formatCurrency(user.balance)}</span>
                  </div>
                )}

                <Button
                  className={cn(
                    "w-full h-12 font-semibold text-base rounded-xl",
                    tradeAction === "BUY" ? "btn-buy" : "btn-sell"
                  )}
                  onClick={handleTrade}
                >
                  {tradeAction === "BUY" ? "Buy" : "Sell"} {quantity} Lot(s)
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
