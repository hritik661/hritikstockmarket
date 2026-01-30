"use client"

import LoginForm from "@/components/login-form"
import { TrendingUp, Shield, Zap, BarChart3, Activity, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

// Animated counter
function AnimatedStat({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState("0")
  
  useEffect(() => {
    const num = parseInt(value.replace(/\D/g, ""))
    const duration = 2000
    const steps = 40
    const increment = num / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= num) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current).toString())
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])
  
  return <span>{display}{suffix}</span>
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-30 z-0" />
      
      {/* Glow Orbs */}
      <div className="glow-orb glow-orb-cyan w-[600px] h-[600px] -top-48 -left-48 z-0" />
      <div className="glow-orb glow-orb-purple w-[500px] h-[500px] -bottom-32 -right-32 z-0" />
      <div className="glow-orb glow-orb-green w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />
      
      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(15)].map((_, i) => (
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

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Side - Premium Branding */}
          <div className="hidden lg:flex flex-col justify-center p-12 xl:p-16 glass-card rounded-l-3xl border-r-0 animate-fade-in-left">
            <div className="space-y-10">
              {/* Logo & Title */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 animate-fade-in-up">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center neon-glow">
                      <TrendingUp className="h-9 w-9 text-black" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-[#00ff88] rounded-full animate-pulse" />
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-gradient neon-text">Hritik Stocks</span>
                    <p className="text-sm text-muted-foreground">Premium Trading Platform</p>
                  </div>
                </div>
                
                <div className="space-y-4 animate-fade-in-up delay-200">
                  <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
                    Trade Smarter
                    <span className="block text-gradient neon-text">with AI Power</span>
                  </h1>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                    Access live NSE market data, advanced charts, AI-powered predictions, 
                    and professional portfolio management.
                  </p>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-2 gap-4 animate-fade-in-up delay-300">
                {[
                  { icon: BarChart3, label: "Live Charts", desc: "Real-time candlestick charts", color: "primary" },
                  { icon: Zap, label: "AI Predictions", desc: "ML-powered market insights", color: "purple-400" },
                  { icon: Shield, label: "Secure Trading", desc: "Bank-grade encryption", color: "[#00ff88]" },
                  { icon: Activity, label: "Options Chain", desc: "Trade NIFTY & BANKNIFTY", color: "[#ffd700]" },
                ].map((feature, i) => (
                  <div 
                    key={i} 
                    className="group p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:bg-secondary/50 card-shine"
                  >
                    <div className={`h-11 w-11 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-5 w-5 text-${feature.color}`} />
                    </div>
                    <p className="font-semibold text-sm mb-1">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-10 pt-6 border-t border-border/30 animate-fade-in-up delay-400">
                <div className="space-y-1">
                  <p className="text-4xl font-bold text-primary neon-text">
                    <AnimatedStat value="10" suffix="K+" />
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Traders</p>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-bold text-[#00ff88] neon-text-green">
                    <AnimatedStat value="50" suffix="+" />
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Stocks Tracked</p>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-bold text-[#ffd700]">
                    <AnimatedStat value="24" suffix="/7" />
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Market Updates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex flex-col justify-center p-8 md:p-12 xl:p-16 glass-card rounded-3xl lg:rounded-l-none lg:rounded-r-3xl animate-fade-in-right">
            {/* Mobile Header */}
            <div className="lg:hidden mb-10 text-center animate-fade-in-down">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center neon-glow">
                    <TrendingUp className="h-8 w-8 text-black" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-[#00ff88] rounded-full animate-pulse" />
                </div>
                <span className="text-2xl font-bold text-gradient neon-text">Hritik Stocks</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to access your trading dashboard</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-10 animate-fade-in-down">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-primary font-medium">Secure OTP Login</span>
              </div>
              <h2 className="text-4xl font-bold mb-3">Sign In</h2>
              <p className="text-muted-foreground text-lg">Enter your email to receive a secure verification code</p>
            </div>

            <div className="animate-fade-in-up delay-200">
              <LoginForm full />
            </div>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-border/30 animate-fade-in-up delay-300">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                <Shield className="h-4 w-4" />
                <span>Protected by bank-grade encryption</span>
              </div>
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                By signing in, you agree to our Terms of Service and Privacy Policy.
                <br />
                <span className="text-primary">New users receive Rs. 10,00,000 virtual trading balance.</span>
              </p>
            </div>

            {/* Quick Links */}
            <div className="mt-6 flex items-center justify-center gap-6 animate-fade-in-up delay-400">
              {["Terms", "Privacy", "Help"].map((link) => (
                <button 
                  key={link}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  {link}
                  <ChevronRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
