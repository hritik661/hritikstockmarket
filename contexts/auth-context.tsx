"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name?: string
  balance: number
  isPredictionPaid?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithOTP: (email: string, otp: string) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>
  signup: (email: string, name: string | undefined, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateBalance: (amount: number) => void
  markPredictionsAsPaid: () => void
  setUserFromData: (user: User) => void
  refreshBalanceFromDatabase: () => Promise<void>
  // Note: auth is local-only and stored in localStorage. Not secure for production.
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Initialize by asking the server who the current session belongs to.
    const initializeAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" })
        if (res.ok) {
          const data = await res.json()
          if (data?.user) setUser(data.user)
        }
      } catch (err) {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    initializeAuth()

    // No localStorage-based session handling; rely on server HttpOnly cookie instead.
    return () => {}
  }, [])

  // Server-backed signup/login flows. No localStorage session tokens.
  const signup = async (email: string, name: string | undefined, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email || !password) return { success: false, error: "Email and password are required" }
      const res = await fetch("/api/auth/signup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), name, password }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data?.error || "Signup failed" }
      if (data.user) setUser(data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Signup failed" }
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email || !password) return { success: false, error: "Email and password are required" }
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data?.error || "Login failed" }
      if (data.user) setUser(data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Login failed" }
    }
  }

  

  const logout = () => {
    ;(async () => {
      try {
        console.log('🔐 Logging out user...')
        const response = await fetch("/api/auth/logout", { method: "POST" })
        console.log('✅ Logout API response:', response.status)
      } catch (err) {
        console.error('❌ Logout API error:', err)
      }
      
      // Clear local state
      setUser(null)
      console.log('✅ User state cleared')
      
      // Clear local storage
      try {
        if (typeof window !== "undefined") {
          localStorage.clear()
          sessionStorage.clear()
          console.log('✅ Storage cleared')
        }
      } catch {}
      
      // Force full page redirect to home
      try {
        if (typeof window !== "undefined") {
          console.log('🔄 Redirecting to home page...')
          window.location.href = "/"
        }
      } catch (err) {
        console.error('❌ Redirect error:', err)
      }
    })()
  }

  const updateBalance = async (amount: number) => {
    if (user) {
      const newBalance = user.balance + amount
      const updatedUser = { ...user, balance: newBalance }
      setUser(updatedUser)

      // Update balance in database
      try {
        await fetch("/api/balance/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, balance: newBalance }),
        })
      } catch (error) {
        console.error("Failed to update balance in database:", error)
      }
    }
  }

  const markPredictionsAsPaid = () => {
    // Refresh user from server - payment handlers should update DB, so re-fetch the session user
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" })
        if (res.ok) {
          const data = await res.json()
          if (data?.user) setUser(data.user)
        }
      } catch (err) {
        // ignore
      }
    })()
  }

  const loginWithOTP = async (email: string, otp: string): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    try {
      if (!email || !otp) return { success: false, error: "Email and OTP are required" }
      
      // Verify OTP
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), otp }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || "OTP verification failed" }
      }

      // Set user from response data (use database balance - source of truth)
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.email.split("@")[0],
        balance: isNaN(data.user.balance) ? 1000000 : Number(data.user.balance) || 1000000,
        isPredictionPaid: data.user.isPredictionPaid || false,
      }

      // Server sets HttpOnly cookie. Just set user state from response.
      setUser(userData)

      return { success: true, isNewUser: data.isNewUser }
    } catch (err) {
      console.error("[v0] OTP login error:", err)
      return { success: false, error: err instanceof Error ? err.message : "OTP login failed" }
    }
  }

  // Refresh balance from database (source of truth)
  const refreshBalanceFromDatabase = async () => {
    if (!user) return
    try {
      const response = await fetch("/api/balance/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })
      const data = await response.json()
      if (data.balance !== undefined) {
        const dbBalance = Number(data.balance) || 1000000
        if (dbBalance !== user.balance) {
          const updatedUser = { ...user, balance: dbBalance }
          setUser(updatedUser)
        }
      }
    } catch (error) {
      console.error("Failed to refresh balance:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, loginWithOTP, signup, logout, updateBalance, markPredictionsAsPaid, setUserFromData: setUser, refreshBalanceFromDatabase }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
