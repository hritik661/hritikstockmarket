import { isMarketOpen } from './market-utils'

/**
 * Enhanced P&L Calculator (Like Groww/AngelOne)
 * 
 * CORRECT P&L CALCULATION:
 * 1. Buy stock at avgPrice (entry price)
 * 2. Current market price changes to currentPrice
 * 3. Unrealized P&L = (currentPrice - avgPrice) * quantity
 * 
 * Example:
 * - Buy 10 shares at Rs 100 each (invested = Rs 1000)
 * - Current price goes to Rs 110
 * - Portfolio Value = 110 * 10 = Rs 1100
 * - P&L = (110 - 100) * 10 = Rs 100 profit
 * - When you SELL: Balance increases by Rs 1100 (current value)
 */

export interface PriceData {
  symbol: string
  avgPrice: number
  quantity: number
  currentPrice?: number
  lastTradingPrice?: number
}

/**
 * Calculate P&L for stock holdings
 * @param avgPrice - Average buy price (entry price)
 * @param currentPrice - Current market price
 * @param quantity - Number of shares
 * @returns P&L amount in rupees (rounded to 2 decimals)
 */
export function calculatePnL(avgPrice: number, currentPrice: number, quantity: number): number {
  const safeAvgPrice = Number(avgPrice) || 0
  const safeCurrentPrice = Number(currentPrice) || 0
  const safeQuantity = Number(quantity) || 0
  
  if (safeAvgPrice <= 0 || safeQuantity <= 0) {
    return 0
  }
  
  // If no current price, return 0 P&L (not negative)
  if (safeCurrentPrice <= 0) {
    return 0
  }
  
  const pnl = (safeCurrentPrice - safeAvgPrice) * safeQuantity
  return Math.round(pnl * 100) / 100
}

/**
 * Calculate P&L percentage
 * @param avgPrice - Average buy price
 * @param currentPrice - Current market price
 * @returns P&L percentage
 */
export function calculatePnLPercent(avgPrice: number, currentPrice: number): number {
  const safeAvgPrice = Number(avgPrice) || 0
  const safeCurrentPrice = Number(currentPrice) || 0
  
  if (safeAvgPrice <= 0 || safeCurrentPrice <= 0) {
    return 0
  }
  
  return ((safeCurrentPrice - safeAvgPrice) / safeAvgPrice) * 100
}

/**
 * Get effective price for P&L calculation
 * 
 * Priority:
 * 1. Use current market price if available (live data)
 * 2. Use last trading price (stored from previous session)
 * 3. Use fallback/entry price only as last resort
 */
export function getEffectivePrice(
  currentPrice: number | undefined,
  lastTradingPrice: number | undefined,
  fallbackPrice: number
): number {
  // Priority 1: Current market price
  if (typeof currentPrice === 'number' && !isNaN(currentPrice) && currentPrice > 0) {
    return currentPrice
  }
  
  // Priority 2: Last trading price
  if (typeof lastTradingPrice === 'number' && !isNaN(lastTradingPrice) && lastTradingPrice > 0) {
    return lastTradingPrice
  }
  
  // Priority 3: Fallback price
  const safeFallback = Number(fallbackPrice) || 0
  return safeFallback > 0 ? safeFallback : 0
}

/**
 * Calculate portfolio metrics
 */
export function calculatePortfolioMetrics(holdings: Array<{
  avgPrice: number
  quantity: number
  currentValue: number
  pnl: number
}>) {
  const totalInvested = holdings.reduce((sum, h) => {
    const investedValue = h.avgPrice * h.quantity
    return sum + (isNaN(investedValue) ? 0 : investedValue)
  }, 0)
  
  const totalCurrentValue = holdings.reduce((sum, h) => {
    return sum + (isNaN(h.currentValue) ? 0 : h.currentValue)
  }, 0)
  
  const totalPnL = totalCurrentValue - totalInvested
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
  
  return {
    totalInvested: isNaN(totalInvested) ? 0 : totalInvested,
    totalCurrentValue: isNaN(totalCurrentValue) ? 0 : totalCurrentValue,
    totalPnL: isNaN(totalPnL) ? 0 : totalPnL,
    totalPnLPercent: isNaN(totalPnLPercent) ? 0 : totalPnLPercent,
  }
}

/**
 * Store last trading price for a symbol
 * Used to maintain deterministic P&L when market is closed
 */
export function storeLastTradingPrice(
  userEmail: string,
  symbol: string,
  price: number
): void {
  try {
    if (!userEmail || !symbol || isNaN(price) || price <= 0) return
    
    const key = `last_trading_price_${userEmail}`
    const prices = (() => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : {}
      } catch {
        return {}
      }
    })()
    
    prices[symbol] = {
      price,
      timestamp: Date.now(),
    }
    
    localStorage.setItem(key, JSON.stringify(prices))
  } catch (error) {
    console.warn('Failed to store last trading price:', error)
  }
}

/**
 * Get last trading price for a symbol
 */
export function getLastTradingPrice(
  userEmail: string,
  symbol: string
): number | undefined {
  try {
    if (!userEmail || !symbol) return undefined
    
    const key = `last_trading_price_${userEmail}`
    const stored = localStorage.getItem(key)
    if (!stored) return undefined
    
    const prices = JSON.parse(stored)
    const data = prices[symbol]
    
    if (data && typeof data.price === 'number' && !isNaN(data.price) && data.price > 0) {
      return data.price
    }
    
    return undefined
  } catch (error) {
    console.warn('Failed to get last trading price:', error)
    return undefined
  }
}

/**
 * Clear all stored trading prices (for logout or reset)
 */
export function clearLastTradingPrices(userEmail: string): void {
  try {
    if (!userEmail) return
    localStorage.removeItem(`last_trading_price_${userEmail}`)
  } catch (error) {
    console.warn('Failed to clear trading prices:', error)
  }
}
