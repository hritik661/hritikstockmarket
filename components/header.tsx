"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  TrendingUp, 
  User, 
  LogOut, 
  Wallet, 
  Sparkles, 
  BarChart3, 
  Briefcase, 
  Info,
  Menu,
  X
} from "lucide-react"
import { formatCurrency } from "@/lib/market-utils"
import { searchStocks } from "@/lib/yahoo-finance"
import { INDIAN_STOCKS } from "@/lib/stocks-data"
import { cn } from "@/lib/utils"

export function Header({ isLandingPage = false }: { isLandingPage?: boolean }) {
  const { user, logout, updateBalance } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string; exchange: string }>>([])
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setSearching(true)

    const localResults = INDIAN_STOCKS.filter(
      (s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.symbol.toLowerCase().includes(query.toLowerCase()),
    )
      .slice(0, 5)
      .map((s) => ({ symbol: s.symbol, name: s.name, exchange: s.exchange }))

    setSearchResults(localResults)
    setShowResults(true)

    const apiResults = await searchStocks(query)
    if (apiResults.length > 0) {
      const combined = [
        ...localResults,
        ...apiResults.filter((r) => !localResults.find((l) => l.symbol === r.symbol)),
      ].slice(0, 10)
      setSearchResults(combined)
    }
    setSearching(false)
  }

  const handleSelectStock = (symbol: string) => {
    router.push(`/stock/${encodeURIComponent(symbol)}`)
    setShowResults(false)
    setSearchQuery("")
    setMobileMenuOpen(false)
  }

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b transition-all duration-300",
      isLandingPage 
        ? "bg-background/80 backdrop-blur-xl border-border/20" 
        : "bg-card/80 backdrop-blur-xl border-border/30 shadow-sm"
    )}>
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <span className="hidden sm:block font-bold text-lg">Hritik Stocks</span>
          </Link>

          {/* Search Bar - Desktop */}
          {!isLandingPage && user && (
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  className="pl-10 h-10 bg-secondary/50 border-border/30 focus:border-primary/50 rounded-xl"
                />
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden z-50">
                    {searching && (
                      <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Searching...
                      </div>
                    )}
                    {searchResults.map((result) => (
                      <button
                        key={`${result.symbol}-${result.exchange}`}
                        onClick={() => handleSelectStock(result.symbol)}
                        className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/20 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{result.symbol.replace('.NS', '').replace('.BO', '')}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{result.name}</p>
                          </div>
                          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                            {result.exchange}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          {user && !isLandingPage && (
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/options">
                <Button variant="ghost" size="sm" className="gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />
                  Options
                </Button>
              </Link>
              <Link href="/predictions">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 text-sm relative overflow-hidden group"
                >
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-medium">
                    Predictions
                  </span>
                </Button>
              </Link>
              <Link href="/portfolio">
                <Button variant="ghost" size="sm" className="gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-blue-400" />
                  Portfolio
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="ghost" size="sm" className="gap-2 text-sm">
                  <Info className="h-4 w-4 text-green-400" />
                  About
                </Button>
              </Link>

              {/* Balance Display */}
              <div className="ml-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold font-mono text-primary">
                    {formatCurrency(user.balance)}
                  </span>
                </div>
              </div>
            </nav>
          )}

          {/* User Menu / Login Buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Mobile Balance */}
                <div className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold font-mono text-primary">
                    {formatCurrency(user.balance)}
                  </span>
                </div>

                {/* Mobile Menu Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-secondary/50">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <div className="px-3 py-2">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                        <Wallet className="h-3 w-3 text-primary" />
                        <span className="text-xs font-semibold font-mono">{formatCurrency(user.balance)}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {user.email === "admin@hrtik.com" && (
                      <DropdownMenuItem asChild className="cursor-pointer text-primary">
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/portfolio">Portfolio</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (!user) return
                        if (!confirm('Reset your balance to 10,00,000?')) return
                        const delta = 1000000 - (user.balance || 0)
                        if (delta !== 0) updateBalance(delta)
                        alert('Balance reset to 10,00,000')
                      }}
                      className="cursor-pointer"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Reset Balance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="hidden md:inline-flex rounded-xl"
                  onClick={() => { try { window.dispatchEvent(new CustomEvent('open-login')) } catch(e){} }}
                >
                  Login
                </Button>
                <Button
                  className="rounded-xl gap-2"
                  onClick={() => { try { window.dispatchEvent(new CustomEvent('open-login')) } catch(e){} }}
                >
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && !isLandingPage && (
          <div className="lg:hidden border-t border-border/30 py-3 space-y-2 animate-slide-up">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="pl-10 h-10 bg-secondary/50 border-border/30 rounded-xl"
              />
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={`mobile-${result.symbol}`}
                      onClick={() => handleSelectStock(result.symbol)}
                      className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/20 last:border-b-0"
                    >
                      <p className="font-semibold text-sm">{result.symbol.replace('.NS', '')}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Nav Links */}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/portfolio" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start gap-2 h-11 rounded-xl bg-blue-500/10 border-blue-500/30 text-blue-400">
                  <Briefcase className="h-4 w-4" />
                  Portfolio
                </Button>
              </Link>
              <Link href="/options" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start gap-2 h-11 rounded-xl bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                  <BarChart3 className="h-4 w-4" />
                  Options
                </Button>
              </Link>
              <Link href="/predictions" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start gap-2 h-11 rounded-xl bg-purple-500/10 border-purple-500/30">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-medium">
                    Predictions
                  </span>
                </Button>
              </Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start gap-2 h-11 rounded-xl bg-green-500/10 border-green-500/30 text-green-400">
                  <Info className="h-4 w-4" />
                  About
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
